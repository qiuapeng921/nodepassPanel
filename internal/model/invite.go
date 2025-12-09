package model

// InviteRecord 邀请记录模型
type InviteRecord struct {
	Base
	InviterID  uint    `gorm:"index;not null" json:"inviter_id"`               // 邀请人ID
	InviteeID  uint    `gorm:"uniqueIndex;not null" json:"invitee_id"`         // 被邀请人ID
	Commission float64 `gorm:"type:decimal(10,2);default:0" json:"commission"` // 返利金额
	OrderID    uint    `gorm:"index" json:"order_id"`                          // 关联订单ID (首次付费时)
	Status     int     `gorm:"default:0" json:"status"`                        // 状态: 0=待结算 1=已结算
}

// TableName 指定表名
func (InviteRecord) TableName() string {
	return "invite_records"
}

// InviteRecordStatus 邀请记录状态
const (
	InviteRecordStatusPending = 0 // 待结算
	InviteRecordStatusSettled = 1 // 已结算
)
