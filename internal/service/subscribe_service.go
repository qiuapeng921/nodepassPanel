package service

import (
	"encoding/base64"
	"fmt"
	"nodepassPanel/internal/global"
	"nodepassPanel/internal/model"
	"strings"

	"gorm.io/gorm"
)

type SubscribeService struct{}

func NewSubscribeService() *SubscribeService {
	return &SubscribeService{}
}

// GetUserSubscribe 生成用户的订阅内容
func (s *SubscribeService) GetUserSubscribe(token string, userAgent string) (string, error) {
	// 1. 查找用户
	var user model.User
	if err := global.DB.Where("uuid = ?", token).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", fmt.Errorf("invalid token")
		}
		return "", err
	}

	// 2. 查找用户的实例
	var instances []model.Instance
	if err := global.DB.Preload("Node").Where("user_id = ? AND enable = ?", user.ID, true).Find(&instances).Error; err != nil {
		return "", err
	}

	// 3. 根据 UA 生成不同格式
	if strings.Contains(strings.ToLower(userAgent), "clash") {
		return s.generateClashConfig(user, instances), nil
	}

	// 默认 Base64 (V2Ray/Shadowrocket)
	return s.generateBase64Config(user, instances), nil
}

// generateBase64Config 生成 Base64 订阅
func (s *SubscribeService) generateBase64Config(user model.User, instances []model.Instance) string {
	var links []string
	for _, ins := range instances {
		if ins.Protocol == "shadowsocks" {
			// ss://method:password@host:port#name
			raw := fmt.Sprintf("%s:%s@%s:%d", ins.Method, ins.Password, ins.Node.Address, ins.ServerPort)
			ssUri := "ss://" + base64.StdEncoding.EncodeToString([]byte(raw)) + "#" + ins.Node.Name
			links = append(links, ssUri)
		}
		// TODO: Support VMess/Trojan
	}

	finalRaw := strings.Join(links, "\n")
	return base64.StdEncoding.EncodeToString([]byte(finalRaw))
}

// generateClashConfig 生成 Clash YAML
func (s *SubscribeService) generateClashConfig(user model.User, instances []model.Instance) string {
	var sb strings.Builder
	sb.WriteString("port: 7890\n")
	sb.WriteString("socks-port: 7891\n")
	sb.WriteString("allow-lan: true\n")
	sb.WriteString("mode: Rule\n")
	sb.WriteString("log-level: info\n")
	sb.WriteString("external-controller: :9090\n")
	sb.WriteString("\nproxies:\n")

	var proxyNames []string

	for _, ins := range instances {
		if ins.Protocol == "shadowsocks" {
			sb.WriteString(fmt.Sprintf("  - name: %s\n", ins.Node.Name))
			sb.WriteString("    type: ss\n")
			sb.WriteString(fmt.Sprintf("    server: %s\n", ins.Node.Address))
			sb.WriteString(fmt.Sprintf("    port: %d\n", ins.ServerPort))
			sb.WriteString(fmt.Sprintf("    password: %s\n", ins.Password))
			sb.WriteString(fmt.Sprintf("    cipher: %s\n", ins.Method))
			sb.WriteString("    udp: true\n\n")

			proxyNames = append(proxyNames, ins.Node.Name)
		}
	}

	sb.WriteString("proxy-groups:\n")
	sb.WriteString("  - name: PROXY\n")
	sb.WriteString("    type: select\n")
	sb.WriteString("    proxies:\n")
	sb.WriteString("      - AUTO\n")
	for _, name := range proxyNames {
		sb.WriteString(fmt.Sprintf("      - %s\n", name))
	}

	sb.WriteString("\n  - name: AUTO\n")
	sb.WriteString("    type: url-test\n")
	sb.WriteString("    url: http://www.gstatic.com/generate_204\n")
	sb.WriteString("    interval: 300\n")
	sb.WriteString("    proxies:\n")
	for _, name := range proxyNames {
		sb.WriteString(fmt.Sprintf("      - %s\n", name))
	}

	// 简单规则
	sb.WriteString("\nrules:\n")
	sb.WriteString("  - MATCH,PROXY\n")

	return sb.String()
}
