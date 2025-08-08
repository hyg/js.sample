// addtask.js
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const baseURL   = process.env.CALDAV_URL.replace(/\/+$/, '');
const username  = process.env.CALDAV_USER;
const password  = process.env.CALDAV_PASS;

const uid = uuidv4();
const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
const start = new Date();
const end   = new Date(Date.now() + 60 * 60 * 1000);   // 1 小时后结束

const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MyApp//NodeJS//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${start.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'}
DTEND:${end.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'}
SUMMARY:完成 Node.js CalDAV 演示
DESCRIPTION:用 axios 写入事件，无需 native 模块
END:VEVENT
END:VCALENDAR`;

const url = `${baseURL}/event-${uid}.ics`;
axios.put(url, ics, {
  auth: { username, password },
  headers: { 'Content-Type': 'text/calendar; charset=utf-8' }
})
  .then(() => console.log('✅ 事件已写入', url))
  .catch(err => console.error(err.response?.data || err));