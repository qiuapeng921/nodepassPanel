package service

import (
	"nodepassPanel/internal/model"
	"nodepassPanel/internal/repository"
	"nodepassPanel/pkg/nodepass"
)

type NodeService struct {
	nodeRepo *repository.NodeRepository
}

func NewNodeService() *NodeService {
	return &NodeService{
		nodeRepo: repository.NewNodeRepository(),
	}
}

// AddNodeRequest 添加节点请求
type AddNodeRequest struct {
	Name     string  `json:"name" binding:"required"`
	Address  string  `json:"address" binding:"required"`
	APIPort  int     `json:"api_port" binding:"required"`
	APIToken string  `json:"api_token" binding:"required"`
	Rate     float64 `json:"rate" binding:"gte=0"`
	Region   string  `json:"region"`
	Country  string  `json:"country"`
}

// AddNode 添加新节点并测试连接
func (s *NodeService) AddNode(req *AddNodeRequest) error {
	// 0. 模型转换
	node := &model.Node{
		Name:     req.Name,
		Address:  req.Address,
		APIPort:  req.APIPort,
		APIToken: req.APIToken,
		Rate:     req.Rate,
		Region:   req.Region,
		Country:  req.Country,
		Status:   1,
	}

	// 1. 验证连接 (调用 NodePass Client)
	client := nodepass.NewClient(node.Address, node.APIPort, node.APIToken, node.Insecure)
	if _, err := client.Ping(); err != nil {
		// 这里暂不阻断创建，只是标记状态或记录日志，或者并在描述中备注
		// return fmt.Errorf("failed to connect to node: %w", err)
		// MVP 阶段先允许添加离线节点
	}

	// 2. 保存到数据库
	return s.nodeRepo.Create(node)
}

// GetNodes 获取节点列表
func (s *NodeService) GetNodes(isAdmin bool) ([]model.Node, error) {
	// 如果是管理员，返回所有；否则返回 Active 的
	if isAdmin {
		return s.nodeRepo.GetAll()
	}
	return s.nodeRepo.GetActiveNodes()
}

// TestNodeConnectivity 测试特定节点连接
func (s *NodeService) TestNodeConnectivity(nodeID uint) (bool, error) {
	node, err := s.nodeRepo.GetByID(nodeID)
	if err != nil {
		return false, err
	}

	client := nodepass.NewClient(node.Address, node.APIPort, node.APIToken, node.Insecure)
	return client.Ping()
}

// UpdateNodeRequest 更新节点请求
type UpdateNodeRequest struct {
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	Address     *string  `json:"address"`
	APIPort     *int     `json:"api_port"`
	APIToken    *string  `json:"api_token"`
	Insecure    *bool    `json:"insecure"`
	Type        *string  `json:"type"`
	Region      *string  `json:"region"`
	Country     *string  `json:"country"`
	Carrier     *string  `json:"carrier"`
	GroupID     *string  `json:"group_id"`
	Rate        *float64 `json:"rate"`
	Sort        *int     `json:"sort"`
	Status      *int     `json:"status"`
}

// GetByID 根据ID获取节点
func (s *NodeService) GetByID(id uint) (*model.Node, error) {
	return s.nodeRepo.GetByID(id)
}

// Update 更新节点
func (s *NodeService) Update(id uint, req *UpdateNodeRequest) (*model.Node, error) {
	node, err := s.nodeRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// 更新非空字段
	if req.Name != nil {
		node.Name = *req.Name
	}
	if req.Description != nil {
		node.Description = *req.Description
	}
	if req.Address != nil {
		node.Address = *req.Address
	}
	if req.APIPort != nil {
		node.APIPort = *req.APIPort
	}
	if req.APIToken != nil {
		node.APIToken = *req.APIToken
	}
	if req.Insecure != nil {
		node.Insecure = *req.Insecure
	}
	if req.Type != nil {
		node.Type = *req.Type
	}
	if req.Region != nil {
		node.Region = *req.Region
	}
	if req.Country != nil {
		node.Country = *req.Country
	}
	if req.Carrier != nil {
		node.Carrier = *req.Carrier
	}
	if req.GroupID != nil {
		node.GroupID = *req.GroupID
	}
	if req.Rate != nil {
		node.Rate = *req.Rate
	}
	if req.Sort != nil {
		node.Sort = *req.Sort
	}
	if req.Status != nil {
		node.Status = *req.Status
	}

	if err := s.nodeRepo.Update(node); err != nil {
		return nil, err
	}

	return node, nil
}

// Delete 删除节点
func (s *NodeService) Delete(id uint) error {
	_, err := s.nodeRepo.GetByID(id)
	if err != nil {
		return err
	}
	return s.nodeRepo.Delete(id)
}

// RefreshStatus 刷新节点状态 (测试连接并更新状态)
func (s *NodeService) RefreshStatus(id uint) (*model.Node, error) {
	node, err := s.nodeRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	client := nodepass.NewClient(node.Address, node.APIPort, node.APIToken, node.Insecure)
	connected, _ := client.Ping()

	if connected {
		node.Status = 1
	} else {
		node.Status = 0
	}

	if err := s.nodeRepo.Update(node); err != nil {
		return nil, err
	}

	return node, nil
}
