package service

import (
	"encoding/json"
	"fmt"
	"nodepassPanel/internal/model"
	"nodepassPanel/internal/repository"
	"nodepassPanel/internal/websocket"
	"time"
)

type MonitorService struct {
	nodeRepo *repository.NodeRepository
}

func NewMonitorService() *MonitorService {
	return &MonitorService{
		nodeRepo: repository.NewNodeRepository(),
	}
}

// CheckNodes 检查所有节点状态 (仅检查服务器节点，不包含通用节点)
func (s *MonitorService) CheckNodes() {
	nodes, err := s.nodeRepo.GetAll()
	if err != nil {
		fmt.Println("Monitor: 获取节点失败:", err)
		return
	}

	updates := make([]map[string]interface{}, 0)

	for _, node := range nodes {
		alive := s.pingNode(&node)
		status := 0
		if alive {
			status = 1
		}

		updates = append(updates, map[string]interface{}{
			"id":     node.ID,
			"name":   node.Name,
			"status": status,
			"load":   "0.1",
		})
	}

	// 通过 WebSocket 广播状态
	if websocket.GlobalHub != nil {
		data, _ := json.Marshal(map[string]interface{}{
			"type": "node_status", // 消息类型
			"data": updates,       // 节点状态数据
			"time": time.Now(),    // 时间戳
		})
		websocket.GlobalHub.Broadcast(data)
	}
}

// pingNode 对节点进行 Ping 检测 (模拟)
func (s *MonitorService) pingNode(node *model.Node) bool {
	// TODO: 实现真实的 TCP/HTTP Ping 逻辑
	// MVP 阶段暂时返回 True
	return true
}
