package repository

import (
	"nodepassPanel/internal/global"
	"nodepassPanel/internal/model"
)

type NodeRepository struct{}

func NewNodeRepository() *NodeRepository {
	return &NodeRepository{}
}

// Create 创建节点
func (r *NodeRepository) Create(node *model.Node) error {
	return global.DB.Create(node).Error
}

// Update 更新节点
func (r *NodeRepository) Update(node *model.Node) error {
	return global.DB.Save(node).Error
}

// Delete 删除节点
func (r *NodeRepository) Delete(id uint) error {
	return global.DB.Delete(&model.Node{}, id).Error
}

// GetByID 根据 ID 获取节点
func (r *NodeRepository) GetByID(id uint) (*model.Node, error) {
	var node model.Node
	err := global.DB.First(&node, id).Error
	if err != nil {
		return nil, err
	}
	return &node, nil
}

// GetAll 获取所有节点
func (r *NodeRepository) GetAll() ([]model.Node, error) {
	var nodes []model.Node
	err := global.DB.Find(&nodes).Error
	return nodes, err
}

// GetActiveNodes 获取所有可用节点
func (r *NodeRepository) GetActiveNodes() ([]model.Node, error) {
	var nodes []model.Node
	err := global.DB.Where("status = ?", 1).Find(&nodes).Error
	return nodes, err
}
