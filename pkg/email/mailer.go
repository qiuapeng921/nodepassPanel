package email

import (
	"crypto/tls"
	"fmt"
	"net/smtp"
	"nodepassPanel/internal/config"
	"nodepassPanel/pkg/logger"
	"strings"

	"go.uber.org/zap"
)

// Mailer 邮件发送器接口
type Mailer interface {
	SendVerifyCode(to, code string, codeType int) error
}

// SMTPMailer SMTP 邮件发送器
type SMTPMailer struct {
	host     string
	port     int
	username string
	password string
	from     string
	fromName string
}

// NewSMTPMailer 创建 SMTP 邮件发送器
func NewSMTPMailer() *SMTPMailer {
	return &SMTPMailer{
		host:     config.App.SMTP.Host,
		port:     config.App.SMTP.Port,
		username: config.App.SMTP.Username,
		password: config.App.SMTP.Password,
		from:     config.App.SMTP.From,
		fromName: config.App.SMTP.FromName,
	}
}

// SendVerifyCode 发送验证码邮件
func (m *SMTPMailer) SendVerifyCode(to, code string, codeType int) error {
	var subject, body string

	switch codeType {
	case 1: // 注册
		subject = "【NyanPass】邮箱验证码"
		body = fmt.Sprintf(`
<div style="max-width: 600px; margin: 0 auto; padding: 30px; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #8B5CF6; margin: 0;">NyanPass</h1>
    <p style="color: #6B7280; margin: 10px 0 0 0;">您的网络加速服务</p>
  </div>
  
  <div style="background: linear-gradient(135deg, #1F2937 0%%, #374151 100%%); border-radius: 16px; padding: 30px; color: white;">
    <h2 style="margin: 0 0 20px 0; font-size: 24px;">验证您的邮箱</h2>
    <p style="color: #9CA3AF; margin: 0 0 20px 0;">您正在注册 NyanPass 账户，请使用以下验证码完成注册：</p>
    
    <div style="background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #8B5CF6;">%s</span>
    </div>
    
    <p style="color: #9CA3AF; margin: 20px 0 0 0; font-size: 14px;">
      验证码有效期为 10 分钟，请尽快使用。<br>
      如非本人操作，请忽略此邮件。
    </p>
  </div>
  
  <p style="text-align: center; color: #6B7280; font-size: 12px; margin-top: 30px;">
    此邮件由系统自动发送，请勿回复
  </p>
</div>
`, code)

	case 2: // 找回密码
		subject = "【NyanPass】重置密码验证码"
		body = fmt.Sprintf(`
<div style="max-width: 600px; margin: 0 auto; padding: 30px; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #8B5CF6; margin: 0;">NyanPass</h1>
  </div>
  
  <div style="background: linear-gradient(135deg, #1F2937 0%%, #374151 100%%); border-radius: 16px; padding: 30px; color: white;">
    <h2 style="margin: 0 0 20px 0; font-size: 24px;">重置您的密码</h2>
    <p style="color: #9CA3AF; margin: 0 0 20px 0;">您正在重置密码，请使用以下验证码：</p>
    
    <div style="background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #8B5CF6;">%s</span>
    </div>
    
    <p style="color: #9CA3AF; margin: 20px 0 0 0; font-size: 14px;">
      验证码有效期为 10 分钟。<br>
      如非本人操作，请立即检查账户安全。
    </p>
  </div>
</div>
`, code)

	default:
		subject = "【NyanPass】验证码"
		body = fmt.Sprintf(`您的验证码是：%s，有效期 10 分钟。`, code)
	}

	return m.send(to, subject, body)
}

// send 发送邮件
func (m *SMTPMailer) send(to, subject, body string) error {
	// 构建邮件内容
	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", m.fromName, m.from)
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"

	var message strings.Builder
	for k, v := range headers {
		message.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	message.WriteString("\r\n")
	message.WriteString(body)

	// SMTP 认证
	auth := smtp.PlainAuth("", m.username, m.password, m.host)
	addr := fmt.Sprintf("%s:%d", m.host, m.port)

	// 如果端口是 465，使用 TLS
	if m.port == 465 {
		return m.sendWithTLS(to, message.String(), auth, addr)
	}

	// 使用 STARTTLS
	err := smtp.SendMail(addr, auth, m.from, []string{to}, []byte(message.String()))
	if err != nil {
		logger.Log.Error("发送邮件失败", zap.Error(err), zap.String("to", to))
		return fmt.Errorf("发送邮件失败: %v", err)
	}

	logger.Log.Info("邮件发送成功", zap.String("to", to), zap.String("subject", subject))
	return nil
}

// sendWithTLS 使用 TLS 发送邮件 (端口 465)
func (m *SMTPMailer) sendWithTLS(to, message string, auth smtp.Auth, addr string) error {
	tlsConfig := &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         m.host,
	}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("TLS 连接失败: %v", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, m.host)
	if err != nil {
		return fmt.Errorf("创建 SMTP 客户端失败: %v", err)
	}
	defer client.Close()

	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP 认证失败: %v", err)
	}

	if err = client.Mail(m.from); err != nil {
		return fmt.Errorf("设置发件人失败: %v", err)
	}

	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("设置收件人失败: %v", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("获取写入器失败: %v", err)
	}

	if _, err = w.Write([]byte(message)); err != nil {
		return fmt.Errorf("写入邮件内容失败: %v", err)
	}

	if err = w.Close(); err != nil {
		return fmt.Errorf("关闭写入器失败: %v", err)
	}

	logger.Log.Info("邮件发送成功（TLS）", zap.String("to", to))
	return nil
}
