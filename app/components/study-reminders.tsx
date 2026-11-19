"use client";

import { useEffect, useState } from "react";

const ENABLED_KEY = "biology-drill-reminders-enabled";
const TIME_KEY = "biology-drill-reminder-time";
const DEFAULT_TIME = "19:00";

type PermissionState = NotificationPermission | "unsupported" | "checking";

function nextReminderDate(time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

export default function StudyReminders() {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(DEFAULT_TIME);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setTime(localStorage.getItem(TIME_KEY) || DEFAULT_TIME);
    setEnabled(localStorage.getItem(ENABLED_KEY) === "true");
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  useEffect(() => {
    if (!enabled || permission !== "granted" || permission === "unsupported") return;

    const schedule = () => {
      const target = nextReminderDate(time);
      const timer = window.setTimeout(() => {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Time for a Biology Drill session", {
            body: "A few minutes of biology practice can help strengthen what you’ve learned.",
            tag: "biology-drill-daily-reminder",
          });
        }
        schedule();
      }, target.getTime() - Date.now());
      return timer;
    };

    const timer = schedule();
    return () => window.clearTimeout(timer);
  }, [enabled, permission, time]);

  function updateTime(value: string) {
    setTime(value);
    localStorage.setItem(TIME_KEY, value);
    setMessage(enabled ? "Reminder time updated." : "Choose a time, then turn reminders on.");
  }

  async function enableReminders() {
    setMessage("");
    if (!("Notification" in window)) {
      setPermission("unsupported");
      setMessage("This browser does not support desktop notifications.");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      setEnabled(true);
      localStorage.setItem(ENABLED_KEY, "true");
      localStorage.setItem(TIME_KEY, time);
      setMessage(`Daily reminder set for ${time}. Keep this app open to receive it.`);
    } else {
      setEnabled(false);
      localStorage.setItem(ENABLED_KEY, "false");
      setMessage(result === "denied" ? "Notifications are blocked in browser settings. Allow them for this site to enable reminders." : "Notification permission was not granted.");
    }
  }

  function disableReminders() {
    setEnabled(false);
    localStorage.setItem(ENABLED_KEY, "false");
    setMessage("Daily reminders are off.");
  }

  return (
    <div className="reminder-widget">
      {open && <section className="reminder-popover" aria-labelledby="reminder-title">
        <div className="reminder-popover-header">
          <div><span className="reference-kicker">BUILD A STUDY HABIT</span><h2 id="reminder-title">Study reminders</h2></div>
          <button className="reminder-close" onClick={() => setOpen(false)} aria-label="Close reminders">×</button>
        </div>
        <p className="reminder-description">Choose a daily time for a gentle nudge to practice biology.</p>
        <label className="reminder-time-label" htmlFor="reminder-time">Daily reminder time</label>
        <input id="reminder-time" className="reminder-time-input" type="time" value={time} onChange={(event) => updateTime(event.target.value)} />
        {enabled ? <button className="reminder-action reminder-off" onClick={disableReminders}>Turn reminders off</button> : <button className="reminder-action" onClick={enableReminders}>Allow notifications &amp; set reminder</button>}
        <p className="reminder-caveat">This MVP uses browser notifications and schedules them only while the app is open. For reminders when it is closed, the app will need push notifications and a service worker.</p>
        {permission === "unsupported" && <p className="reminder-message" role="status">Notifications are not supported in this browser.</p>}
        {message && <p className="reminder-message" role="status">{message}</p>}
      </section>}
      <button className={`reminder-launcher${enabled ? " reminder-enabled" : ""}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Study reminder settings">
        <span aria-hidden="true">◷</span>{enabled ? "Reminder on" : "Remind me to study"}
      </button>
    </div>
  );
}
