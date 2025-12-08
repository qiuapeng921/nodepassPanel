package service

import (
	"errors"
	"math/rand"
	"nodepassPanel/internal/global"
	"nodepassPanel/internal/model"
	"nodepassPanel/pkg/email"
	"nodepassPanel/pkg/logger"
	"strconv"
	"time"

	"go.uber.org/zap"
)

// VerifyCodeService 验证码服务
type VerifyCodeService struct {
	mailer email.Mailer
}

// NewVerifyCodeService 创建验证码服务实例
func NewVerifyCodeService() *VerifyCodeService {
	return &VerifyCodeService{
		mailer: email.NewSMTPMailer(),
	}
}

// SendCodeRequest 发送验证码请求
type SendCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
	Type  int    `json:"type" binding:"required,min=1,max=3"`
}

// VerifyCodeRequest 验证验证码请求
type VerifyCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required,len=6"`
	Type  int    `json:"type" binding:"required,min=1,max=3"`
}

// SendCode 发送验证码
func (s *VerifyCodeService) SendCode(req *SendCodeRequest, ip string) error {
	// 检查发送频率限制 (1分钟内只能发一次)
	var recentCode model.VerifyCode
	oneMinuteAgo := time.Now().Add(-1 * time.Minute)
	if err := global.DB.Where("email = ? AND type = ? AND created_at > ?",
		req.Email, req.Type, oneMinuteAgo).First(&recentCode).Error; err == nil {
		return errors.New("发送太频繁，请稍后再试")
	}

	// 检查同一邮箱一天内发送次数限制 (最多10次)
	var count int64
	today := time.Now().Truncate(24 * time.Hour)
	global.DB.Model(&model.VerifyCode{}).Where("email = ? AND type = ? AND created_at > ?",
		req.Email, req.Type, today).Count(&count)
	if count >= 10 {
		return errors.New("今日发送次数已达上限")
	}

	// 生成6位随机验证码
	code := s.generateCode()

	// 保存验证码
	verifyCode := &model.VerifyCode{
		Email:     req.Email,
		Code:      code,
		Type:      req.Type,
		Used:      false,
		ExpiredAt: time.Now().Add(10 * time.Minute), // 10分钟有效
		IP:        ip,
	}

	if err := global.DB.Create(verifyCode).Error; err != nil {
		logger.Log.Error("保存验证码失败", zap.Error(err))
		return errors.New("发送失败，请稍后重试")
	}

	// 发送邮件
	if err := s.mailer.SendVerifyCode(req.Email, code, req.Type); err != nil {
		logger.Log.Error("发送验证码邮件失败", zap.Error(err))
		return errors.New("邮件发送失败，请检查邮箱地址")
	}

	return nil
}

// VerifyCode 验证验证码
func (s *VerifyCodeService) VerifyCode(req *VerifyCodeRequest) error {
	var verifyCode model.VerifyCode
	if err := global.DB.Where("email = ? AND code = ? AND type = ? AND used = ?",
		req.Email, req.Code, req.Type, false).
		Order("created_at DESC").
		First(&verifyCode).Error; err != nil {
		return errors.New("验证码错误")
	}

	// 检查是否过期
	if !verifyCode.IsValid() {
		return errors.New("验证码已过期")
	}

	// 标记为已使用
	verifyCode.Used = true
	if err := global.DB.Save(&verifyCode).Error; err != nil {
		logger.Log.Error("更新验证码状态失败", zap.Error(err))
	}

	return nil
}

// CheckCodeValid 检查验证码是否有效（不标记为已使用）
func (s *VerifyCodeService) CheckCodeValid(emailAddr, code string, codeType int) bool {
	var verifyCode model.VerifyCode
	if err := global.DB.Where("email = ? AND code = ? AND type = ? AND used = ?",
		emailAddr, code, codeType, false).
		Order("created_at DESC").
		First(&verifyCode).Error; err != nil {
		return false
	}

	return verifyCode.IsValid()
}

// MarkCodeUsed 标记验证码为已使用
func (s *VerifyCodeService) MarkCodeUsed(emailAddr, code string, codeType int) {
	global.DB.Model(&model.VerifyCode{}).
		Where("email = ? AND code = ? AND type = ?", emailAddr, code, codeType).
		Update("used", true)
}

// generateCode 生成6位随机数字验证码
func (s *VerifyCodeService) generateCode() string {
	code := rand.Intn(900000) + 100000 // 100000 - 999999
	return strconv.Itoa(code)
}
