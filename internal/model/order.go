package model

import "time"

// Order 订单模型
type Order struct {
	Base
	OrderNo   string  `gorm:"type:varchar(64);uniqueIndex;not null" json:"order_no"` // 订单号
	Type      string  `gorm:"type:varchar(20);default:'plan'" json:"type"`           // 订单类型: plan, recharge
	UserID    uint    `gorm:"index;not null" json:"user_id"`                         // 用户ID
	PlanID    *uint   `gorm:"index" json:"plan_id"`                                  // 套餐ID (可选)
	CouponID  *uint   `gorm:"index" json:"coupon_id"`                                // 优惠券ID (可选)
	TradeNo   string  `gorm:"type:varchar(128)" json:"trade_no"`                     // 第三方支付单号
	PayMethod string  `gorm:"type:varchar(32)" json:"pay_method"`                    // 支付方式: stripe, alipay, wechat, manual
	Amount    float64 `gorm:"type:decimal(10,2);not null" json:"amount"`             // 订单金额
	Discount  float64 `gorm:"type:decimal(10,2);default:0" json:"discount"`          // 优惠金额
	Paid      float64 `gorm:"type:decimal(10,2);default:0" json:"paid"`              // 实付金额

	// 状态: 0-待支付 1-已支付 2-已取消 3-已退款
	Status int `gorm:"default:0;index" json:"status"`

	// 时间
	PaidAt     *time.Time `json:"paid_at"`     // 支付时间
	RefundedAt *time.Time `json:"refunded_at"` // 退款时间
	ExpiredAt  *time.Time `json:"expired_at"`  // 订单过期时间 (未支付自动取消)

	// 备注
	Remark string `gorm:"type:text" json:"remark"`

	// 关联
	User User `gorm:"foreignKey:UserID" json:"-"`
	Plan Plan `gorm:"foreignKey:PlanID" json:"-"`
}

// TableName 指定表名
func (Order) TableName() string {
	return "orders"
}

// 订单状态常量
const (
	OrderStatusPending   = 0 // 待支付
	OrderStatusPaid      = 1 // 已支付
	OrderStatusCancelled = 2 // 已取消
	OrderStatusRefunded  = 3 // 已退款

	OrderTypePlan     = "plan"     // 套餐订单
	OrderTypeRecharge = "recharge" // 充值订单
)
