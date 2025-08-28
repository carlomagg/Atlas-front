import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toHttps } from '../../utils/media';
import {
  listChatRooms,
  listChatMessages,
  postChatMessage,
  pinChatMessage,
  broadcastRoomMessage,
} from '../../services/agentChatApi';

const Paginator = ({ page, setPage, hasNext, hasPrev }) => (
  <div className="flex items-center justify-end gap-2 mt-3">
    <button disabled={!hasPrev} onClick={() => setPage((p) => Math.max(1, p - 1))} className={`px-3 py-1 text-sm rounded border ${hasPrev ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Prev</button>
    <span className="text-xs text-gray-500">Page {page}</span>
    <button disabled={!hasNext} onClick={() => setPage((p) => p + 1)} className={`px-3 py-1 text-sm rounded border ${hasNext ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Next</button>
  </div>
);

const AgentChat = () => {
  const { user } = useAuth();
  const isAdmin = !!(user && (user.is_staff || user.is_superuser || user.role === 'admin'));

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState('');

  const [activeRoom, setActiveRoom] = useState(null);

  const [msgs, setMsgs] = useState([]);
  const [msgsCount, setMsgsCount] = useState(0);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [msgsError, setMsgsError] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [composer, setComposer] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [banner, setBanner] = useState({ type: '', message: '' });

  const bottomRef = useRef(null);

  const hasPrev = page > 1;
  const hasNext = page * limit < msgsCount;

  const loadRooms = async () => {
    setRoomsLoading(true); setRoomsError('');
    try {
      const data = await listChatRooms();
      // Support various backend shapes: array, {results: []}, {rooms: []}
      const results = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.rooms)
          ? data.rooms
          : (Array.isArray(data) ? data : []);
      // Debug aid
      try { console.log('Chat rooms loaded:', { raw: data, parsedCount: results.length }); } catch {}
      setRooms(results);
      if (!activeRoom && results.length) setActiveRoom(results[0]);
      if (!results.length) {
        setRoomsError('No chat rooms available. If you are an agent, ensure your account is active and assigned to a state.');
      }
    } catch (e) {
      setRoomsError(e?.message || 'Failed to load rooms');
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!activeRoom) return;
    setMsgsLoading(true); setMsgsError('');
    try {
      // Per guide, endpoint may not accept room filter; fetch and filter client-side
      const data = await listChatMessages({ page, ordering: '-created_at' });
      const all = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const filtered = all.filter((m) => m.room === activeRoom.id);
      setMsgs(filtered);
      setMsgsCount(filtered.length);
    } catch (e) {
      setMsgsError(e?.message || 'Failed to load messages');
      setMsgs([]); setMsgsCount(0);
    } finally {
      setMsgsLoading(false);
      // Scroll to bottom on load
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    }
  };

  useEffect(() => { loadRooms(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { setPage(1); }, [activeRoom]);
  useEffect(() => { loadMessages(); /* eslint-disable-next-line */ }, [activeRoom, page]);

  // UI gating helpers
  const canSend = !!(activeRoom && composer.trim() && !sending);
  const disabledReason = !activeRoom
    ? 'Select a chat room from the list to enable sending.'
    : (sending ? 'Sending in progress…' : '');

  const send = async () => {
    if (!activeRoom || !composer.trim()) return;
    setSending(true);
    try {
      await postChatMessage({ room: activeRoom.id, content: composer, attachment: file || undefined });
      setComposer(''); setFile(null);
      // Refresh first page to show newest on top if ordering is -created_at
      setPage(1);
      await loadMessages();
      setBanner({ type: 'success', message: 'Message sent.' });
    } catch (e) {
      setBanner({ type: 'error', message: e?.message || 'Failed to send message' });
    } finally {
      setSending(false);
    }
  };

  const pin = async (mId) => {
    try {
      await pinChatMessage(mId);
      await loadMessages();
      setBanner({ type: 'success', message: 'Pinned.' });
    } catch (e) {
      setBanner({ type: 'error', message: e?.message || 'Failed to pin message' });
    }
  };

  const broadcast = async () => {
    if (!isAdmin || !activeRoom || !composer.trim()) return;
    setSending(true);
    try {
      await broadcastRoomMessage(activeRoom.id, { content: composer });
      setComposer(''); setFile(null);
      await loadMessages();
      setBanner({ type: 'success', message: 'Broadcast sent.' });
    } catch (e) {
      setBanner({ type: 'error', message: e?.message || 'Failed to broadcast' });
    } finally {
      setSending(false);
    }
  };

  const title = useMemo(() => {
    if (!activeRoom) return 'Agents Chat';
    const parts = [];
    if (activeRoom.name) parts.push(activeRoom.name);
    if (activeRoom.state) parts.push(`(${activeRoom.state})`);
    return parts.join(' ');
  }, [activeRoom]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Agents Chat</h1>

      {/* Grid: Rooms list | Messages panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rooms */}
        <div className="lg:col-span-1 border rounded-lg bg-white">
          <div className="p-3 border-b bg-gray-50 rounded-t-lg flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Rooms</span>
          </div>
          <div className="p-3 max-h-[60vh] overflow-auto">
            {roomsLoading && <div className="text-sm text-gray-500">Loading...</div>}
            {roomsError && <div className="text-sm text-red-600">{roomsError}</div>}
            {!roomsLoading && !rooms.length && <div className="text-sm text-gray-500">No rooms available.</div>}
            <ul className="space-y-2">
              {rooms.map((r) => (
                <li key={r.id}>
                  <button onClick={() => setActiveRoom(r)} className={`w-full text-left p-2 rounded border hover:bg-gray-50 ${activeRoom?.id === r.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="text-sm font-medium text-gray-800 truncate">{r.name || `Room #${r.id}`}</div>
                    <div className="text-xs text-gray-500 flex gap-2">
                      {r.state ? <span>{r.state}</span> : null}
                      {typeof r.member_count === 'number' ? <span>• {r.member_count} members</span> : null}
                      {r.is_active === false ? <span className="text-red-600">• inactive</span> : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2 border rounded-lg bg-white min-h-[50vh] flex flex-col">
          <div className="p-3 border-b bg-gray-50 rounded-t-lg flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{title}</span>
          </div>

          {/* Banner */}
          <div className="p-4">
            {banner.message && (
              banner.type === 'success' ? (
                <div className="mb-3 rounded border-l-4 border-green-500 px-3 py-2 text-sm bg-green-50 text-green-700 shadow-sm animate-pulse">{banner.message}</div>
              ) : (
                <div className="mb-3 rounded border px-3 py-2 text-sm border-red-300 bg-red-50 text-red-700">{banner.message}</div>
              )
            )}
          </div>

          {/* Messages list */}
          <div className="px-4 pb-2 grow overflow-auto">
            {msgsLoading && <div className="text-sm text-gray-500">Loading...</div>}
            {msgsError && <div className="text-sm text-red-600">{msgsError}</div>}
            {!msgsLoading && !msgs.length && <div className="text-sm text-gray-500">No messages</div>}

            <div className="space-y-3">
              {msgs.map((m) => {
                // Prefer API-provided absolute URL; fallback to other fields
                const apiUrl = m?.attachment_url ?? m?.attachment_file?.url ?? m?.attachment_link ?? m?.attachment;
                const raw = typeof apiUrl === 'string' ? apiUrl : (m?.attachment_base64 || '');
                // If backend sent a relative /media path, prefix with backend origin from env (prod only). Absolute URLs untouched.
                let resolved = raw;
                try {
                  if (typeof raw === 'string' && raw.startsWith('/media')) {
                    const base = (import.meta && import.meta.env && import.meta.env.VITE_API_ORIGIN) ? import.meta.env.VITE_API_ORIGIN : '';
                    resolved = base ? `${base}${raw}` : raw;
                  }
                } catch {}
                const att = toHttps(resolved);
                const isDataUrl = typeof att === 'string' && att.startsWith('data:');
                const isImage = typeof att === 'string' && (isDataUrl ? att.startsWith('data:image') : /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)(\?.*)?$/i.test(att));
                const attName = m?.attachment_name || 'attachment';
                return (
                  <div key={m.id} className={`border rounded p-2 ${m.is_admin_broadcast ? 'bg-blue-50 border-blue-200' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] text-gray-600">
                        <span className="font-medium text-gray-800">{m.sender_name || 'Agent'}</span>
                        <span className="ml-2 text-gray-500">{new Date(m.created_at || Date.now()).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.is_admin_broadcast ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white">Broadcast</span>
                        ) : null}
                        {m.is_pinned ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500 text-white">Pinned</span>
                        ) : null}
                        {isAdmin && (
                          <button onClick={() => pin(m.id)} className="text-[11px] px-2 py-0.5 rounded border bg-white hover:bg-gray-50">Pin</button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap break-words mt-1">{m.content}</div>
                    {att ? (
                      <div className="mt-2">
                        {isImage ? (
                          <img src={att} alt={attName} className="max-h-64 max-w-full h-auto w-auto rounded border" />
                        ) : (
                          <a href={att} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{attName || 'Open file'}</a>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-gray-300 rounded-full" />
                        <span>No preview available{attName ? ` — ${attName}` : ''}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <Paginator page={page} setPage={setPage} hasPrev={hasPrev} hasNext={hasNext} />
          </div>

          {/* Composer */}
          <div className="p-4 border-t bg-gray-50 rounded-b-lg">
            <div className="flex flex-col gap-2">
              <textarea
                rows={3}
                className="w-full border rounded p-2 text-sm"
                placeholder={isAdmin ? 'Type a message (or broadcast if admin)...' : 'Type a message...'}
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
              />
              <div className="flex items-center justify-between gap-3">
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs" />
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button onClick={broadcast} disabled={!canSend} className={`px-3 py-2 text-sm rounded-md text-white ${!canSend ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{sending ? 'Sending…' : 'Broadcast'}</button>
                  )}
                  <button onClick={send} disabled={!canSend} className={`px-3 py-2 text-sm rounded-md text-white ${!canSend ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{sending ? 'Sending…' : 'Send'}</button>
                </div>
              </div>
              {(!canSend && disabledReason) && (
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 border-l-4 border-amber-500 px-3 py-2 rounded">
                  {disabledReason}
                </div>
              )}
              {(activeRoom && activeRoom.is_active === false) && (
                <div className="mt-2 text-xs text-red-700 bg-red-50 border-l-4 border-red-500 px-3 py-2 rounded">
                  This room is inactive; you may read history but cannot interact until it is reactivated.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
