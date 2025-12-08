package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	Base
	UUID     string `gorm:"type:varchar(36);uniqueIndex" json:"uuid"` // 订阅唯一标识 (SQLite兼容)
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

// BeforeCreate 钩子：生成 UUID 和 邀请码
func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.UUID == "" {
		u.UUID = uuid.NewString()
	}
	if u.InviteCode == "" {
		u.InviteCode = uuid.NewString()[:8] // 简单截取，实际应查重
	}
	return
}
