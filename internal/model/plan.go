package model

// Plan 套餐模型
type Plan struct {
	Base
	Name        string  `gorm:"type:varchar(100);not null" json:"name"`
	Description string  `gorm:"type:text" json:"description"`
	Price       float64 `gorm:"type:decimal(10,2);not null" json:"price"`

	// 限制
	Duration    int   `gorm:"not null" json:"duration"`      // 有效期(天)
	Transfer    int64 `gorm:"not null" json:"transfer"`      // 流量限制(GB)
	SpeedLimit  int   `gorm:"default:0" json:"speed_limit"`  // 速度限制(Mbps, 0不限)
	DeviceLimit int   `gorm:"default:0" json:"device_limit"` // 设备数限制

	// 权限
	GroupID int  `gorm:"default:1" json:"group_id"`   // 赋予的用户组/等级
	Hidden  bool `gorm:"default:false" json:"hidden"` // 是否隐藏
	Sort    int  `gorm:"default:0" json:"sort"`
}

// TableName 指定表名
func (Plan) TableName() string {
	return "plans"
}
