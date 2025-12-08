package model

import "time"

// Announcement 公告模型
type Announcement struct {
	Base
	Title    string `gorm:"type:varchar(255);not null" json:"title"` // 标题
	Content  string `gorm:"type:text;not null" json:"content"`       // 内容 (支持 Markdown)
	Tags     string `gorm:"type:varchar(255)" json:"tags"`           // 标签 (逗号分隔)
	Priority int    `gorm:"default:0" json:"priority"`               // 优先级 (数字越大越靠前)
	Popup    bool   `gorm:"default:false" json:"popup"`              // 是否强制弹窗

	// 状态: 0-草稿 1-已发布 2-已下线
	Status int `gorm:"default:0;index" json:"status"`

	// 有效期
	PublishedAt *time.Time `json:"published_at"` // 发布时间
	ExpiredAt   *time.Time `json:"expired_at"`   // 过期时间 (null 永不过期)
}

// TableName 指定表名
func (Announcement) TableName() string {
	return "announcements"
}

// 公告状态常量
const (
	AnnouncementStatusDraft     = 0 // 草稿
	AnnouncementStatusPublished = 1 // 已发布
	AnnouncementStatusOffline   = 2 // 已下线
)
