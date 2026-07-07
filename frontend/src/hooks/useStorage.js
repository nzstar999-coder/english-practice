// 本地存储和状态管理 hooks

import { useState, useEffect, useCallback } from 'react';

// 学习记录管理
const STORAGE_KEY = 'english_practice_records';

export function getStoredRecords() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {
      dailySessions: [],     // 每日训练记录
      scores: [],            // 跟读评分记录
      conversations: [],     // AI对话记录
      completedLevels: [],   // 已完成的关卡
      streakDays: 0,        // 连续天数
      lastPracticeDate: null,
    };
  } catch {
    return {
      dailySessions: [],
      scores: [],
      conversations: [],
      completedLevels: [],
      streakDays: 0,
      lastPracticeDate: null,
    };
  }
}

export function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// 记录跟读评分
export function addScoreRecord(sceneId, sceneName, sentence, score, userText, problems) {
  const records = getStoredRecords();
  records.scores.push({
    id: Date.now(),
    sceneId,
    sceneName,
    sentence,
    score,
    userText,
    problems,
    date: new Date().toISOString(),
  });
  saveRecords(records);
}

// 记录AI对话
export function addConversationRecord(sceneId, sceneName, summary, history) {
  const records = getStoredRecords();
  records.conversations.push({
    id: Date.now(),
    sceneId,
    sceneName,
    summary,
    messageCount: history.length,
    date: new Date().toISOString(),
  });
  saveRecords(records);
}

// 完成关卡
export function completeLevel(sceneId, levelIndex) {
  const records = getStoredRecords();
  const key = `${sceneId}-${levelIndex}`;
  if (!records.completedLevels.includes(key)) {
    records.completedLevels.push(key);
  }
  saveRecords(records);
}

// 记录每日训练
export function recordDailySession(minutes, type) {
  const records = getStoredRecords();
  const today = new Date().toISOString().split('T')[0];
  records.dailySessions.push({ id: Date.now(), date: today, minutes, type });

  // 更新连续天数
  if (records.lastPracticeDate) {
    const lastDate = new Date(records.lastPracticeDate);
    const todayDate = new Date(today);
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      records.streakDays += 1;
    } else if (diffDays > 1) {
      records.streakDays = 1;
    }
  } else {
    records.streakDays = 1;
  }
  records.lastPracticeDate = today;
  saveRecords(records);
}

// Hook: 获取学习统计
export function useLearningStats() {
  const [stats, setStats] = useState({
    totalScores: 0,
    averageScore: 0,
    totalConversations: 0,
    totalLevels: 0,
    completedLevels: 0,
    streakDays: 0,
    todayMinutes: 0,
  });

  useEffect(() => {
    const records = getStoredRecords();
    const today = new Date().toISOString().split('T')[0];

    const totalScores = records.scores.length;
    const averageScore = totalScores > 0
      ? Math.round(records.scores.reduce((s, r) => s + r.score, 0) / totalScores)
      : 0;

    const todayMinutes = records.dailySessions
      .filter(s => s.date === today)
      .reduce((s, r) => s + r.minutes, 0);

    setStats({
      totalScores,
      averageScore,
      totalConversations: records.conversations.length,
      totalLevels: 25, // 5场景 × 5关卡
      completedLevels: records.completedLevels.length,
      streakDays: records.streakDays,
      todayMinutes,
    });
  }, []);

  return stats;
}

// Hook: 获取错误句子（用于复习）
export function useErrorSentences() {
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const records = getStoredRecords();
    // 获取得分低于70的句子，最近7天的
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentErrors = records.scores
      .filter(r => r.score < 70 && new Date(r.date) > sevenDaysAgo)
      .sort((a, b) => a.score - b.score)
      .slice(0, 10);
    setErrors(recentErrors);
  }, []);

  return errors;
}

// 计时器 Hook
export function useTimer(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => { setSeconds(0); setIsRunning(false); }, []);

  const formatTime = useCallback(() => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [seconds]);

  return { seconds, isRunning, start, pause, reset, formatTime };
}
