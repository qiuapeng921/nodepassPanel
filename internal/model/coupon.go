package model

import "time"

// Coupon 优惠券模型
type Coupon struct {
	Base
	Code string `gorm:"type:varchar(32);uniqueIndex;not null" json:"code"` // 优惠券码

	// 类型: 1-固定金额 2-百分比 3-免费天数
	Type int `gorm:"not null" json:"type"`

	// 值: 根据类型解读
	// Type=1 时表示减免金额
	// Type=2 时表示折扣百分比 (10 表示 10% off)
	// Type=3 时表示赠送天数
	Value float64 `gorm:"type:decimal(10,2);not null" json:"value"`

	// 使用限制
	MinAmount    float64 `gorm:"type:decimal(10,2);default:0" json:"min_amount"`   // 最低消费金额
	MaxDiscount  float64 `gorm:"type:decimal(10,2);default:0" json:"max_discount"` // 最大折扣金额 (Type=2 时有效)
	LimitPerUser int     `gorm:"default:1" json:"limit_per_user"`                  // 每用户使用次数限制
	TotalLimit   int     `gorm:"default:0" json:"total_limit"`                     // 总使用次数限制 (0 不限)
	UsedCount    int     `gorm:"default:0" json:"used_count"`                      // 已使用次数

	// 适用范围
	PlanIDs string `gorm:"type:varchar(255)" json:"plan_ids"` // 适用套餐ID列表 (逗号分隔, 空表示全部)

	// 有效期
	StartAt   *time.Time `json:"start_at"`   // 开始时间
	ExpiredAt *time.Time `json:"expired_at"` // 过期时间

	// 状态: 0-禁用 1-启用
	Status int `gorm:"default:1;index" json:"status"`
}

// TableName 指定表名
func (Coupon) TableName() string {
	return "coupons"
}

// 优惠券类型常量
const (
	CouponTypeFixedAmount = 1 // 固定金额
	CouponTypePercentage  = 2 // 百分比折扣
	CouponTypeFreeDays    = 3 // 免费天数
)
