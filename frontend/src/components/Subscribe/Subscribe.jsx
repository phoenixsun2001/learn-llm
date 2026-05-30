import React, { useState, useCallback } from 'react';
import './Subscribe.css';

const Subscribe = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleChange = useCallback((e) => setEmail(e.target.value), []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    /* MVP: Show confirmation — Future: connect to email service (Mailchimp, ConvertKit, etc.) */
    setSubscribed(true);
  }, []);

  return (
    <div className="subscribe">
      <h4 className="subscribe-title">订阅更新</h4>
      <p className="subscribe-desc">获取最新教程和 AI 工具更新通知。</p>
      {subscribed ? (
        <div className="subscribe-success" role="status">
          订阅成功！感谢你的关注。
        </div>
      ) : (
        <form className="subscribe-form" onSubmit={handleSubmit}>
          <label htmlFor="subscribe-email" className="sr-only">邮箱地址</label>
          <input
            id="subscribe-email"
            type="email"
            className="subscribe-input"
            placeholder="your@email.com"
            value={email}
            onChange={handleChange}
            required
            aria-label="邮箱地址"
          />
          <button type="submit" className="subscribe-btn">
            订阅
          </button>
        </form>
      )}
    </div>
  );
};

export default Subscribe;
