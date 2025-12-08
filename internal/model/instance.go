package model

// Instance 转发实例模型 (记录用户在节点上的具体端口分配)
type Instance struct {
	Base
	UserID uint `gorm:"index;not null" json:"user_id"`
	NodeID uint `gorm:"index;not null" json:"node_id"`

	// 分配的端口信息
	ServerPort int    `gorm:"not null" json:"server_port"` // 外部端口
	Password   string `gorm:"type:varchar(255)" json:"password"`
	Method     string `gorm:"type:varchar(50);default:'aes-256-gcm'" json:"method"`
	Protocol   string `gorm:"type:varchar(20);default:'shadowsocks'" json:"protocol"` // shadowsocks, vmess, trojan

	// 状态
	Enable bool `gorm:"default:true" json:"enable"`

	// 关联
	User User `gorm:"foreignKey:UserID" json:"-"`
	Node Node `gorm:"foreignKey:NodeID" json:"-"`
}

// TableName 指定表名
func (Instance) TableName() string {
	return "instances"
}
