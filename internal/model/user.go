package model

import (
	"time"
)

// User 用户模型
type User struct {
	Base
	Email    string `gorm:"type:varchar(100);uniqueIndex;not null" json:"email"`
	Password string `gorm:"type:varchar(255);not null" json:"-"`
	Salt     string `gorm:"type:varchar(32)" json:"-"`

	// 资产信息
	Balance    float64 `gorm:"type:decimal(10,2);default:0" json:"balance"`
	Commission float64 `gorm:"type:decimal(10,2);default:0" json:"commission"`

	// 流量控制 (单位: Bytes)
	Upload         int64 `gorm:"default:0" json:"upload"`
	Download       int64 `gorm:"default:0" json:"download"`
	TransferEnable int64 `gorm:"default:0" json:"transfer_enable"`

	// 状态与权限
	Status    int        `gorm:"default:1" json:"status"`
	IsAdmin   bool       `gorm:"default:false" json:"is_admin"`
	GroupID   int        `gorm:"default:1" json:"group_id"`
	ExpiredAt *time.Time `json:"expired_at"`

	// 邀请系统
	InviteCode string `gorm:"type:varchar(32);uniqueIndex" json:"invite_code"`
	InvitedBy  uint   `gorm:"index" json:"invited_by"`

	// 第三方绑定
	TelegramID int64 `gorm:"uniqueIndex" json:"telegram_id"`

	// 系统信息
	LastLoginAt *time.Time `json:"last_login_at"`
	LastLoginIP string     `gorm:"type:varchar(46)" json:"last_login_ip"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}
