package nodepass

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Client NodePass Master API 客户端
type Client struct {
	BaseURL string
	Token   string
	Client  *http.Client
}

// NewClient 创建新的 NodePass 客户端
func NewClient(address string, port int, token string, insecure bool) *Client {
	protocol := "http"
	if insecure { // 这里的 insecure 逻辑简化处理，生产环境可能涉及 TLS 配置
		// protocol = "https"
	}

	baseURL := fmt.Sprintf("%s://%s:%d/api/v1", protocol, address, port)

	return &Client{
		BaseURL: baseURL,
		Token:   token,
		Client:  &http.Client{Timeout: 5 * time.Second},
	}
}

// GenericResponse 通用响应
type GenericResponse struct {
	Success bool            `json:"success"`
	Data    json.RawMessage `json:"data"`
	Error   string          `json:"error"`
}

// Ping 测试连接
func (c *Client) Ping() (bool, error) {
	// 假设有一个 /ping 接口
	req, err := http.NewRequest("GET", c.BaseURL+"/ping", nil)
	if err != nil {
		return false, err
	}

	c.setHeaders(req)

	resp, err := c.Client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		return true, nil
	}
	return false, fmt.Errorf("bad status: %d", resp.StatusCode)
}

// SyncUser 同步用户到节点 (示例)
func (c *Client) SyncUser(userMap map[string]interface{}) error {
	data, _ := json.Marshal(userMap)
	req, err := http.NewRequest("POST", c.BaseURL+"/users/sync", bytes.NewBuffer(data))
	if err != nil {
		return err
	}

	c.setHeaders(req)

	resp, err := c.Client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("sync failed: %d", resp.StatusCode)
	}
	return nil
}

func (c *Client) setHeaders(req *http.Request) {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.Token)
	req.Header.Set("User-Agent", "NyanPass-Panel/1.0")
}
