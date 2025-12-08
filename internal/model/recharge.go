package model

// RechargeCode 充值卡密模型
type RechargeCode struct {
	Base
	Code      string  `gorm:"type:varchar(32);uniqueIndex;not null" json:"code"` // 充值卡密
	Amount    float64 `gorm:"type:decimal(10,2);not null" json:"amount"`         // 充值金额
	Used      bool    `gorm:"default:false" json:"used"`                         // 是否已使用
	UsedBy    uint    `gorm:"index" json:"used_by"`                              // 使用者ID
	UsedAt    *string `json:"used_at"`                                           // 使用时间
	Remark    string  `gorm:"type:varchar(200)" json:"remark"`                   // 备注
	CreatedBy uint    `json:"created_by"`                                        // 创建者ID
}

// TableName 指定表名
func (RechargeCode) TableName() string {
	return "recharge_codes"
}

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
