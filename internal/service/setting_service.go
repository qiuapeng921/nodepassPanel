package service

import (
	"nodepassPanel/internal/model"
	"nodepassPanel/internal/repository"
)

// SettingService 系统设置服务层
type SettingService struct {
	settingRepo *repository.SettingRepository
}

// NewSettingService 创建设置服务实例
func NewSettingService() *SettingService {
	return &SettingService{
		settingRepo: repository.NewSettingRepository(),
	}
}

// SettingItem 单个设置项
type SettingItem struct {
	Key   string `json:"key" binding:"required"`
	Value string `json:"value"`
	Type  string `json:"type"`
	Group string `json:"group"`
	Desc  string `json:"desc"`
}

// BatchUpdateRequest 批量更新请求
type BatchUpdateRequest struct {
	Settings []SettingItem `json:"settings" binding:"required"`
}

// Get 获取单个设置
func (s *SettingService) Get(key string) (string, error) {
	setting, err := s.settingRepo.Get(key)
	if err != nil {
		return "", err
	}
	return setting.Value, nil
}

// GetByGroup 获取分组设置
func (s *SettingService) GetByGroup(group string) ([]model.Setting, error) {
	return s.settingRepo.GetByGroup(group)
}

// GetAll 获取所有设置（管理员）
func (s *SettingService) GetAll() ([]model.Setting, error) {
	return s.settingRepo.GetAll()
}

// GetPublic 获取公开设置（用户端）
func (s *SettingService) GetPublic() (map[string]string, error) {
	settings, err := s.settingRepo.GetPublic()
	if err != nil {
		return nil, err
	}

	result := make(map[string]string)
	for _, s := range settings {
		result[s.Key] = s.Value
	}
	return result, nil
}

// Set 设置单个值
func (s *SettingService) Set(key, value string) error {
	return s.settingRepo.Set(key, value, "string", "", "")
}

// SetWithMeta 设置值（带元数据）
func (s *SettingService) SetWithMeta(item SettingItem) error {
	return s.settingRepo.Set(item.Key, item.Value, item.Type, item.Group, item.Desc)
}

// BatchUpdate 批量更新设置
func (s *SettingService) BatchUpdate(req *BatchUpdateRequest) error {
	for _, item := range req.Settings {
		if err := s.SetWithMeta(item); err != nil {
			return err
		}
	}
	return nil
}

// Delete 删除设置
func (s *SettingService) Delete(key string) error {
	return s.settingRepo.Delete(key)
}

// InitDefaultSettings 初始化默认设置
func (s *SettingService) InitDefaultSettings() error {
	defaults := []SettingItem{
		{Key: model.SettingKeySiteName, Value: "NyanPass", Type: "string", Group: model.SettingGroupSite, Desc: "站点名称"},
		{Key: model.SettingKeySiteDescription, Value: "高性能中转面板", Type: "string", Group: model.SettingGroupSite, Desc: "站点描述"},
		{Key: model.SettingKeySiteLogo, Value: "", Type: "string", Group: model.SettingGroupSite, Desc: "站点 Logo URL"},
		{Key: model.SettingKeyContactTelegram, Value: "", Type: "string", Group: model.SettingGroupSite, Desc: "客服 Telegram"},

		{Key: model.SettingKeyRegisterEnabled, Value: "true", Type: "bool", Group: model.SettingGroupSite, Desc: "是否开放注册"},
		{Key: model.SettingKeyInviteRequired, Value: "false", Type: "bool", Group: model.SettingGroupInvite, Desc: "注册是否需要邀请码"},
		{Key: model.SettingKeyInviteRewardDays, Value: "7", Type: "int", Group: model.SettingGroupInvite, Desc: "邀请奖励天数"},

		{Key: model.SettingKeyPaymentEnabled, Value: "true", Type: "bool", Group: model.SettingGroupPayment, Desc: "是否开放支付"},

		// 邮件设置
		{Key: model.SettingKeyMailHost, Value: "smtp.example.com", Type: "string", Group: model.SettingGroupMail, Desc: "SMTP 服务器地址"},
		{Key: model.SettingKeyMailPort, Value: "465", Type: "int", Group: model.SettingGroupMail, Desc: "SMTP 端口"},
		{Key: model.SettingKeyMailUser, Value: "user@example.com", Type: "string", Group: model.SettingGroupMail, Desc: "SMTP 账号"},
		{Key: model.SettingKeyMailPass, Value: "", Type: "string", Group: model.SettingGroupMail, Desc: "SMTP 密码"},
		{Key: model.SettingKeyMailFrom, Value: "NyanPass <no-reply@example.com>", Type: "string", Group: model.SettingGroupMail, Desc: "发件人地址"},

		// 订阅设置
		{Key: model.SettingKeySubscribeDomain, Value: "http://localhost:8081", Type: "string", Group: model.SettingGroupSite, Desc: "订阅域名"},
	}

	for _, item := range defaults {
		// 只有不存在时才设置
		if _, err := s.settingRepo.Get(item.Key); err != nil {
			if err := s.SetWithMeta(item); err != nil {
				return err
			}
		}
	}
	return nil
}
