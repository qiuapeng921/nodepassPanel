package model

import (
	"time"
)

// VerifyCode 验证码模型
type VerifyCode struct {
	Base
	Email     string    `gorm:"type:varchar(100);index;not null" json:"email"` // 邮箱
	Code      string    `gorm:"type:varchar(10);not null" json:"code"`         // 验证码
	Type      int       `gorm:"default:1" json:"type"`                         // 类型: 1=注册 2=找回密码 3=绑定邮箱
	Used      bool      `gorm:"default:false" json:"used"`                     // 是否已使用
	ExpiredAt time.Time `json:"expired_at"`                                    // 过期时间
	IP        string    `gorm:"type:varchar(46)" json:"ip"`                    // 请求IP
}

// TableName 指定表名
func (VerifyCode) TableName() string {
	return "verify_codes"
}

// IsValid 检查验证码是否有效
func (v *VerifyCode) IsValid() bool {
	return !v.Used && time.Now().Before(v.ExpiredAt)
}

// VerifyCodeType 验证码类型
const (
	VerifyCodeTypeRegister      = 1 // 注册
	VerifyCodeTypeResetPassword = 2 // 找回密码
	VerifyCodeTypeBindEmail     = 3 // 绑定邮箱
)
