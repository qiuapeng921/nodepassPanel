package model

// Setting 系统设置模型 (键值对存储)
type Setting struct {
	Base
	Key   string `gorm:"type:varchar(64);uniqueIndex;not null" json:"key"` // 设置键名
	Value string `gorm:"type:text" json:"value"`                           // 设置值
	Type  string `gorm:"type:varchar(20);default:'string'" json:"type"`    // 值类型: string, int, bool, json
	Group string `gorm:"type:varchar(32);index" json:"group"`              // 分组: site, payment, mail, etc.
	Desc  string `gorm:"type:varchar(255)" json:"desc"`                    // 描述
}

// TableName 指定表名
func (Setting) TableName() string {
	return "settings"
}

// 预定义设置键名常量
const (
	// 站点设置
	SettingKeySiteName        = "site_name"        // 站点名称
	SettingKeySiteLogo        = "site_logo"        // 站点Logo URL
	SettingKeySiteDescription = "site_description" // 站点描述
	SettingKeyContactTelegram = "contact_telegram" // Telegram 客服
	SettingKeyContactEmail    = "contact_email"    // 邮箱客服

	// 功能开关
	SettingKeyRegisterEnabled = "register_enabled" // 是否开放注册
	SettingKeyInviteRequired  = "invite_required"  // 注册是否需要邀请码
	SettingKeyPaymentEnabled  = "payment_enabled"  // 是否开放支付

	// 邀请系统
	SettingKeyInviteRewardDays = "invite_reward_days" // 邀请奖励天数

	// 订阅设置
	SettingKeySubscribeDomain = "subscribe_domain" // 订阅域名
)

// 设置分组常量
const (
	SettingGroupSite    = "site"    // 站点设置
	SettingGroupPayment = "payment" // 支付设置
	SettingGroupMail    = "mail"    // 邮件设置
	SettingGroupInvite  = "invite"  // 邀请设置
)
