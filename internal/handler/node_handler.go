package handler

import (
	"net/http"
	"nodepassPanel/internal/middleware"
	"nodepassPanel/internal/service"
	"nodepassPanel/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

// NodeHandler 节点处理器
type NodeHandler struct {
	nodeService *service.NodeService
}

// NewNodeHandler 创建节点处理器实例
func NewNodeHandler() *NodeHandler {
	return &NodeHandler{
		nodeService: service.NewNodeService(),
	}
}

// AddNode 添加节点
// @Summary 添加节点（管理员）
// @Tags Admin/Node
// @Accept json
// @Param request body service.AddNodeRequest true "节点信息"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/nodes [post]
func (h *NodeHandler) AddNode(c *gin.Context) {
	var req service.AddNodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.nodeService.AddNode(&req); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// ListNodes 获取节点列表
// @Summary 获取节点列表
// @Tags Node
// @Success 200 {object} response.Response
// @Router /api/v1/nodes [get]
func (h *NodeHandler) ListNodes(c *gin.Context) {
	// 从中间件上下文获取管理员状态
	isAdmin := middleware.IsAdmin(c)

	nodes, err := h.nodeService.GetNodes(isAdmin)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nodes)
}

// Get 获取节点详情
// @Summary 获取节点详情（管理员）
// @Tags Admin/Node
// @Param id path int true "节点ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/nodes/{id} [get]
func (h *NodeHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid node id")
		return
	}

	node, err := h.nodeService.GetByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "node not found")
		return
	}

	response.Success(c, node)
}

// Update 更新节点
// @Summary 更新节点（管理员）
// @Tags Admin/Node
// @Accept json
// @Param id path int true "节点ID"
// @Param request body service.UpdateNodeRequest true "节点信息"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/nodes/{id} [put]
func (h *NodeHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid node id")
		return
	}

	var req service.UpdateNodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	node, err := h.nodeService.Update(uint(id), &req)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, node)
}

// Delete 删除节点
// @Summary 删除节点（管理员）
// @Tags Admin/Node
// @Param id path int true "节点ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/nodes/{id} [delete]
func (h *NodeHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid node id")
		return
	}

	if err := h.nodeService.Delete(uint(id)); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// TestNode 测试节点连接
// @Summary 测试节点连接（管理员）
// @Tags Admin/Node
// @Param id path int true "节点ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/nodes/{id}/ping [post]
func (h *NodeHandler) TestNode(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid node id")
		return
	}

	connected, err := h.nodeService.TestNodeConnectivity(uint(id))
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{"connected": connected})
}

// Refresh 刷新节点状态
// @Summary 刷新节点状态（管理员）
// @Tags Admin/Node
// @Param id path int true "节点ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/nodes/{id}/refresh [post]
func (h *NodeHandler) Refresh(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid node id")
		return
	}

	node, err := h.nodeService.RefreshStatus(uint(id))
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, node)
}
