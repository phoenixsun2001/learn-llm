import React, { useState, useCallback } from 'react';
import { message } from 'antd';
import './Subscribe.css';

const SUBSCRIBERS_KEY = 'learn-llm-subscribers';

/**
 * Integration hook for a real email service (Mailchimp, ConvertKit, etc.).
 * Currently a no-op stub that records leads locally — nothing is sent yet.
 * To go live, replace the body with an API call to your provider.
 */
async function submitToEmailService(email) {
  // TODO(integration): POST to your email-service endpoint, e.g.
  // const resp = await fetch('/api/subscribe', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email }),
  // });
  // if (!resp.ok) throw new Error('subscribe failed');
  return { ok: true, stored: 'local' };
}

function loadSubscribers() {
  try { return JSON.parse(localStorage.getItem(SUBSCRIBERS_KEY) || '[]'); } catch { return []; }
}

function saveSubscriber(email) {
  const list = loadSubscribers();
  if (!list.includes(email)) {
    list.push(email);
    try { localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(list)); } catch { /* quota / unavailable */ }
  }
  return list.length;
}

const Subscribe = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleChange = useCallback((e) => setEmail(e.target.value), []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    // Always record the lead locally so it is never lost.
    saveSubscriber(value);
    try {
      await submitToEmailService(value);
      setSubscribed(true);
    } catch (err) {
      console.error('Subscribe failed:', err);
      message.error('订阅失败，请稍后再试。');
    }
  }, [email]);

  return (
    <div className="subscribe">
      <h4 className="subscribe-title">订阅更新</h4>
      <p className="subscribe-desc">获取最新教程和 AI 工具更新通知。</p>
      {subscribed ? (
        <div className="subscribe-success" role="status">
          已记录你的邮箱（{email}）。邮件通知服务开通后，我们会第一时间联系你，感谢关注！
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
