package model

// Node 节点模型 (对应 NodePass Master)
type Node struct {
	Base
	Name        string `gorm:"type:varchar(100);not null" json:"name"` // 节点名称
	Description string `gorm:"type:varchar(255)" json:"description"`   // 节点描述

	// 连接信息 (连接到 NodePass Master API)
	Address  string `gorm:"type:varchar(255);not null" json:"address"` // IP 或域名
	APIPort  int    `gorm:"not null" json:"api_port"`                  // Master API 端口
	APIToken string `gorm:"type:varchar(255)" json:"-"`                // Master API Token (不返回给前端)
	Insecure bool   `gorm:"default:false" json:"insecure"`             // 是否跳过 SSL 验证 (如果是 HTTPS)

	// 属性
	Type    string `gorm:"type:varchar(20);default:'remote'" json:"type"` // remote (对接NodePass), local (保留)
	Region  string `gorm:"type:varchar(10);default:'HK'" json:"region"`   // 地区代码 (CN, HK, US, JP...)
	Country string `gorm:"type:varchar(50)" json:"country"`               // 国家全称
	Carrier string `gorm:"type:varchar(50)" json:"carrier"`               // 运营商 (CMCC, AWS...)

	// 策略控制
	GroupID string  `gorm:"type:varchar(255);default:'1'" json:"group_id"` // 可访问的用户组 ID 列表 (逗号分隔 "1,2,3")
	Rate    float64 `gorm:"type:decimal(5,2);default:1.0" json:"rate"`     // 流量倍率
	Sort    int     `gorm:"default:0" json:"sort"`                         // 排序权重 (大在前)

	// 状态监控 (由定时任务更新)
	Status     int     `gorm:"default:1" json:"status"`      // 1:在线 0:离线/故障
	OnlineUser int     `gorm:"default:0" json:"online_user"` // 当前在线用户数
	Load       float64 `gorm:"default:0" json:"load"`        // 系统负载
	Ping       int     `gorm:"default:0" json:"ping"`        // 面板到节点的延迟 (ms)
}

// TableName 指定表名
func (Node) TableName() string {
	return "nodes"
}
