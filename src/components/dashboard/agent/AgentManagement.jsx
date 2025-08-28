import React, { useEffect, useMemo, useState, useId } from 'react';
import AgentChat from '../AgentChat';
import {
  listMyAgentApplications,
  listAgents,
  getAgentReferralStats,
  getAgentReferralEarnings,
  listReferredUsers,
  getReferralPaymentStatus,
  purchaseOrExtendReferralLink,
  agentRegisterUser,
  BUSINESS_TYPE_OPTIONS,
  COUNTRY_OPTIONS,
} from '../../../services/authApi';
import { getErrorMessage } from '../../../utils/errorUtils';

const SectionCard = ({ title, children, rightEl }) => (
  <section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg md:text-xl font-semibold text-gray-800">{title}</h2>
      {rightEl}
    </div>
    {children}
  </section>
);

const Table = ({ columns, data, empty }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">{empty || 'No data available.'}</div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const useFetch = (fn, deps = [], opts = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!opts.immediate);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!opts.immediate) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fn()
      .then((res) => {
        if (!cancelled) setData(res?.results || res || []);
      })
      .catch((e) => !cancelled && setError(getErrorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = async (...args) => {
    setLoading(true);
    setError('');
    try {
      const res = await fn(...args);
      setData(res?.results || res || []);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return { data, setData, loading, error, refetch };
};

const Tabs = ({ tabs, current, onChange }) => (
  <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-4">
    {tabs.map((t) => (
      <button
        key={t.key}
        onClick={() => onChange(t.key)}
        className={`px-4 py-2 text-sm rounded-t-md border-b-2 transition-colors ${
          current === t.key ? 'border-[#027DDB] text-[#027DDB] bg-blue-50' : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        }`}
      >
        {t.label}
      </button>
    ))}
  </div>
);

const ApplicationsSection = () => {
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-submitted_at');

  const { data, loading, error, refetch } = useFetch(
    () => listMyAgentApplications({ search, ordering }),
    [search, ordering],
    { immediate: true }
  );

  const columns = useMemo(
    () => [
      { key: 'id', title: 'ID' },
      {
        key: 'name',
        title: 'Name',
        render: (_, row) => row.user_full_name || [row.first_name, row.last_name].filter(Boolean).join(' ') || '-'
      },
      {
        key: 'email',
        title: 'Email',
        render: (_, row) => row.email || row.user_email || '-'
      },
      { key: 'phone_number', title: 'Phone' },
      { key: 'status', title: 'Status' },
      {
        key: 'submitted_at',
        title: 'Submitted',
        render: (v, row) => {
          const dt = v || row.created_at || row.created || row.applied_at;
          return dt ? new Date(dt).toLocaleString() : '-';
        }
      },
      {
        key: 'updated_at',
        title: 'Updated',
        render: (v, row) => {
          const dt = v || row.modified_at || row.last_updated_at;
          return dt ? new Date(dt).toLocaleString() : '-';
        }
      }
    ],
    []
  );

  return (
    <SectionCard
      title="My Applications"
      rightEl={
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <select value={ordering} onChange={(e) => setOrdering(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="-submitted_at">Newest</option>
            <option value="submitted_at">Oldest</option>
            <option value="status">Status</option>
            <option value="updated_at">Updated</option>
          </select>
          <button onClick={() => refetch()} className="px-3 py-2 bg-[#027DDB] text-white rounded-md text-sm">Refresh</button>
        </div>
      }
    >
      {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
      {loading ? <div className="py-6 text-center text-gray-500">Loading...</div> : <Table columns={columns} data={Array.isArray(data) ? data : data || []} />}
    </SectionCard>
  );
};

const AgentsDirectorySection = () => {
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-agent_approved_at');
  const { data, loading, error, refetch } = useFetch(
    () => listAgents({ search, ordering }),
    [search, ordering],
    { immediate: true }
  );

  const columns = useMemo(
    () => [
      { key: 'id', title: 'ID' },
      { key: 'full_name', title: 'Name' },
      { key: 'email', title: 'Email' },
      { key: 'phone_number', title: 'Phone' },
      { key: 'is_agent_active', title: 'Active', render: (v) => (v ? 'Yes' : 'No') },
      { key: 'agent_approved_at', title: 'Approved At' },
      { key: 'business_type', title: 'Type' },
      { key: 'country', title: 'Country' },
    ],
    []
  );

  return (
    <SectionCard
      title="Agents Directory"
      rightEl={
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <select value={ordering} onChange={(e) => setOrdering(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="-agent_approved_at">Newest Agents</option>
            <option value="date_joined">Date Joined</option>
          </select>
          <button onClick={() => refetch()} className="px-3 py-2 bg-[#027DDB] text-white rounded-md text-sm">Refresh</button>
        </div>
      }
    >
      {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
      {loading ? <div className="py-6 text-center text-gray-500">Loading...</div> : <Table columns={columns} data={Array.isArray(data) ? data : data || []} />}
    </SectionCard>
  );
};

const ReferralStatsSection = () => {
  const { data, loading, error, refetch } = useFetch(() => getAgentReferralStats(), [], { immediate: true });
  return (
    <SectionCard
      title="Referral Overview"
      rightEl={<button onClick={() => refetch()} className="px-3 py-2 bg-[#027DDB] text-white rounded-md text-sm">Refresh</button>}
    >
      {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
      {loading ? (
        <div className="py-6 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded border bg-gray-50">
            <div className="text-sm text-gray-600">Total Referrals</div>
            <div className="text-2xl font-semibold">{data?.total_referrals ?? 0}</div>
          </div>
          <div className="p-4 rounded border bg-gray-50">
            <div className="text-sm text-gray-600">Active Referrals</div>
            <div className="text-2xl font-semibold">{data?.active_referrals ?? 0}</div>
          </div>
          <div className="p-4 rounded border bg-gray-50">
            <div className="text-sm text-gray-600">Total Earnings</div>
            <div className="text-2xl font-semibold">{data?.total_earnings ?? '0'}</div>
          </div>
          <div className="p-4 rounded border bg-gray-50">
            <div className="text-sm text-gray-600">Pending Earnings</div>
            <div className="text-2xl font-semibold">{data?.pending_earnings ?? '0'}</div>
          </div>
          <div className="p-4 rounded border bg-gray-50 md:col-span-2">
            <div className="text-sm text-gray-600">Referral Link</div>
            <div className="flex items-center justify-between gap-3">
              <div className="truncate text-sm">{data?.referral_link || 'No active link'}</div>
              {!!data?.referral_link && (
                <a href={data.referral_link} target="_blank" rel="noreferrer" className="px-3 py-2 bg-[#027DDB] text-white rounded-md text-sm">Open</a>
              )}
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
};

const ReferralEarningsSection = () => {
  const [ordering, setOrdering] = useState('-created_at');
  const { data, loading, error, refetch } = useFetch(
    () => getAgentReferralEarnings({ ordering }),
    [ordering],
    { immediate: true }
  );

  const columns = useMemo(
    () => [
      { key: 'id', title: 'ID' },
      { key: 'earning_type', title: 'Type' },
      { key: 'amount', title: 'Amount' },
      { key: 'payment_status', title: 'Payment' },
      { key: 'description', title: 'Description' },
      { key: 'created_at', title: 'Created' },
    ],
    []
  );

  return (
    <SectionCard
      title="Referral Earnings"
      rightEl={
        <div className="flex gap-2">
          <select value={ordering} onChange={(e) => setOrdering(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="-created_at">Newest</option>
            <option value="created_at">Oldest</option>
            <option value="amount">Amount</option>
            <option value="payment_status">Payment</option>
          </select>
          <button onClick={() => refetch()} className="px-3 py-2 bg-[#027DDB] text-white rounded-md text-sm">Refresh</button>
        </div>
      }
    >
      {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
      {loading ? <div className="py-6 text-center text-gray-500">Loading...</div> : <Table columns={columns} data={Array.isArray(data) ? data : data || []} />}
    </SectionCard>
  );
};

const ReferredUsersSection = () => {
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-date_joined');
  const { data, loading, error, refetch } = useFetch(
    () => listReferredUsers({ search, ordering }),
    [search, ordering],
    { immediate: true }
  );

  const columns = useMemo(
    () => [
      { key: 'id', title: 'ID' },
      { key: 'full_name', title: 'Name' },
      { key: 'email', title: 'Email' },
      { key: 'phone_number', title: 'Phone' },
      { key: 'date_joined', title: 'Joined' },
      { key: 'is_active', title: 'Active', render: (v) => (v ? 'Yes' : 'No') },
    ],
    []
  );

  return (
    <SectionCard
      title="Referred Users"
      rightEl={
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <select value={ordering} onChange={(e) => setOrdering(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="-date_joined">Newest</option>
            <option value="date_joined">Oldest</option>
          </select>
          <button onClick={() => refetch()} className="px-3 py-2 bg-[#027DDB] text-white rounded-md text-sm">Refresh</button>
        </div>
      }
    >
      {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
      {loading ? <div className="py-6 text-center text-gray-500">Loading...</div> : <Table columns={columns} data={Array.isArray(data) ? data : data || []} />}
    </SectionCard>
  );
};

const ReferralPaymentSection = () => {
  const { data, loading, error, refetch } = useFetch(() => getReferralPaymentStatus(), [], { immediate: true });
  const [duration, setDuration] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');

  const onPurchase = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitMsg('');
    try {
      const res = await purchaseOrExtendReferralLink({ payment_duration: Number(duration) });
      setSubmitMsg(res?.message || 'Updated successfully');
      await refetch();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionCard title="Referral Link Status">
      {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
      {loading ? (
        <div className="py-6 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded border bg-gray-50">
              <div className="text-sm text-gray-600">Active</div>
              <div className="text-xl font-semibold">{data?.link_status?.active ? 'Yes' : 'No'}</div>
            </div>
            <div className="p-4 rounded border bg-gray-50">
              <div className="text-sm text-gray-600">Payment Status</div>
              <div className="text-xl font-semibold">{data?.link_status?.payment_status || '-'}</div>
            </div>
            <div className="p-4 rounded border bg-gray-50">
              <div className="text-sm text-gray-600">Expires At</div>
              <div className="text-xl font-semibold">{data?.link_status?.expires_at || '-'}</div>
            </div>
            <div className="p-4 rounded border bg-gray-50">
              <div className="text-sm text-gray-600">Monthly Price</div>
              <div className="text-xl font-semibold">{data?.pricing?.monthly_price ? `${data.pricing.monthly_price} ${data?.pricing?.currency || ''}` : '-'}</div>
            </div>
          </div>

          <form onSubmit={onPurchase} className="flex items-end gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
              <input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#027DDB] text-white rounded-md disabled:opacity-50">
              {submitting ? 'Processing...' : data?.link_status?.active ? 'Extend' : 'Purchase'}
            </button>
            <button type="button" onClick={() => refetch()} className="px-3 py-2 border rounded-md">Refresh</button>
          </form>

          {submitError && <div className="p-3 bg-red-50 text-red-700 rounded">{submitError}</div>}
          {submitMsg && <div className="p-3 bg-green-50 text-green-700 rounded">{submitMsg}</div>}
        </div>
      )}
    </SectionCard>
  );
};

const AgentRegisterUserSection = () => {
  const toggleId = useId();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm_password: '',
    title: 'MR',
    full_name: '',
    phone_number: '',
    company_name: '',
    country: 'NG',
    business_type: 'RETAILER',
    referral_code: '',
    is_agent: false,
    agent_application: {
      first_name: '',
      last_name: '',
      phone_number: '',
      address: '',
      bank_name: '',
      account_number: '',
      id_type: '',
      id_number: '',
      id_document: null,
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onAgentToggle = (e) => setForm((p) => ({ ...p, is_agent: e.target.checked, business_type: e.target.checked ? 'AGENT' : p.business_type }));
  const onAgentAppChange = (e) =>
    setForm((p) => ({ ...p, agent_application: { ...p.agent_application, [e.target.name]: e.target.value } }));
  const onAgentDocChange = (e) =>
    setForm((p) => ({ ...p, agent_application: { ...p.agent_application, id_document: e.target.files?.[0] || null } }));

  const intendsAgent = form.is_agent || form.business_type === 'AGENT';

  // Friendly labels -> enum codes (sent to backend)
  const ID_TYPE_OPTIONS = [
    { label: 'National ID', value: 'NIN' },
    { label: 'Driver’s License', value: 'DRIVERS_LICENSE' },
    { label: 'International Passport', value: 'INTERNATIONAL_PASSPORT' },
    { label: 'Voter’s Card', value: 'VOTERS_CARD' },
  ];

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    setFieldErrors({});
    try {
      const payload = { ...form };
      // If not intending agent, drop empty agent_application block
      if (!intendsAgent) delete payload.agent_application;
      // If there is an ID document file, attach Cloudinary override so service can upload & send JSON URL
      const maybeFile = payload?.agent_application?.id_document;
      if (maybeFile && typeof File !== 'undefined' && maybeFile instanceof File) {
        const cloud_name = (import.meta && import.meta.env && import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) || 'dpyjezkla';
        const upload_preset = (import.meta && import.meta.env && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) || 'carlomagg';
        payload.cloudinary = { cloud_name, upload_preset };
      }
      const res = await agentRegisterUser(payload);
      setSuccess(res?.message || 'User registered');
    } catch (err) {
      // Map agent_application.missing_fields to UI highlights if provided
      const data = err?.data;
      if (data?.agent_application?.missing_fields) {
        const fe = {};
        data.agent_application.missing_fields.forEach((k) => {
          fe[`agent_application.${k}`] = 'Required';
        });
        setFieldErrors(fe);
      }
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionCard title="Register a New User">
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input name="email" type="email" value={form.email} onChange={onChange} className="w-full px-3 py-2 border rounded" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input name="phone_number" value={form.phone_number} onChange={onChange} className="w-full px-3 py-2 border rounded" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={onChange}
              className="w-full px-3 py-2 border rounded pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-2 my-auto h-8 px-2 text-gray-500 hover:text-gray-700"
            >
              {/* eye icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showPassword ? (
                  <>
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a21.77 21.77 0 0 1 5.06-6.94" />
                    <path d="M1 1l22 22" />
                    <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <div className="relative">
            <input
              name="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              value={form.confirm_password}
              onChange={onChange}
              className="w-full px-3 py-2 border rounded pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute inset-y-0 right-2 my-auto h-8 px-2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showConfirm ? (
                  <>
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a21.77 21.77 0 0 1 5.06-6.94" />
                    <path d="M1 1l22 22" />
                    <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <select name="title" value={form.title} onChange={onChange} className="w-full px-3 py-2 border rounded">
            {['MR', 'MRS', 'MS', 'MISS', 'DR'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input name="full_name" value={form.full_name} onChange={onChange} className="w-full px-3 py-2 border rounded" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input name="company_name" value={form.company_name} onChange={onChange} className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select name="country" value={form.country} onChange={onChange} className="w-full px-3 py-2 border rounded" required>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag ? `${c.flag} ` : ''}{c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
          <select name="business_type" value={form.business_type} onChange={onChange} className="w-full px-3 py-2 border rounded" required>
            {BUSINESS_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 flex items-center gap-3 mt-2">
          <input id={toggleId} type="checkbox" checked={!!form.is_agent || form.business_type === 'AGENT'} onChange={onAgentToggle} />
          <label htmlFor={toggleId} className="text-sm text-gray-800">Make this user an Agent (requires additional details)</label>
        </div>

        {intendsAgent && (
          <div className="md:col-span-2">
            <div className="mt-2 p-4 rounded-lg border border-blue-200 bg-blue-50">
              <div className="font-medium text-blue-800 mb-3">Agent Application Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input name="first_name" value={form.agent_application.first_name} onChange={onAgentAppChange} className={`w-full px-3 py-2 border rounded ${fieldErrors['agent_application.first_name'] ? 'border-red-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input name="last_name" value={form.agent_application.last_name} onChange={onAgentAppChange} className={`w-full px-3 py-2 border rounded ${fieldErrors['agent_application.last_name'] ? 'border-red-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input name="phone_number" value={form.agent_application.phone_number} onChange={onAgentAppChange} className={`w-full px-3 py-2 border rounded ${fieldErrors['agent_application.phone_number'] ? 'border-red-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input name="address" value={form.agent_application.address} onChange={onAgentAppChange} className={`w-full px-3 py-2 border rounded ${fieldErrors['agent_application.address'] ? 'border-red-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input name="bank_name" value={form.agent_application.bank_name} onChange={onAgentAppChange} className={`w-full px-3 py-2 border rounded ${fieldErrors['agent_application.bank_name'] ? 'border-red-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input name="account_number" value={form.agent_application.account_number} onChange={onAgentAppChange} className={`w-full px-3 py-2 border rounded ${fieldErrors['agent_application.account_number'] ? 'border-red-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                  <select
                    name="id_type"
                    value={form.agent_application.id_type}
                    onChange={onAgentAppChange}
                    className={`w-full px-3 py-2 border rounded ${fieldErrors['agent_application.id_type'] ? 'border-red-400' : ''}`}
                  >
                    <option value="">Select ID Type</option>
                    {ID_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                  <input name="id_number" value={form.agent_application.id_number} onChange={onAgentAppChange} className={`w-full px-3 py-2 border rounded ${fieldErrors['agent_application.id_number'] ? 'border-red-400' : ''}`} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Document (optional file)</label>
                  <input type="file" accept="image/*,.pdf" onChange={onAgentDocChange} className="w-full" />
                  {form.agent_application.id_document instanceof File && (
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="mb-1">Selected: {form.agent_application.id_document.name}</div>
                      {form.agent_application.id_document.type?.startsWith('image/') ? (
                        <img
                          alt="Preview"
                          src={URL.createObjectURL(form.agent_application.id_document)}
                          className="h-24 w-auto rounded border"
                          onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                        />
                      ) : (
                        <div className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 rounded">
                          <span className="text-xs">Preview not available</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code (optional)</label>
          <input name="referral_code" value={form.referral_code} onChange={onChange} className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="md:col-span-2 flex gap-2 items-center">
          <button disabled={submitting} className="px-4 py-2 bg-[#027DDB] text-white rounded disabled:opacity-50">{submitting ? 'Submitting...' : 'Register'}</button>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
        </div>
      </form>
    </SectionCard>
  );
};

const AgentManagement = () => {
  const [tab, setTab] = useState('applications');
  const tabs = [
    { key: 'applications', label: 'Applications' },
    { key: 'directory', label: 'Agents Directory' },
    { key: 'stats', label: 'Referral Stats' },
    { key: 'earnings', label: 'Earnings' },
    { key: 'referred', label: 'Referred Users' },
    { key: 'payment', label: 'Referral Payment' },
    { key: 'register', label: 'Register User' },
    { key: 'chat', label: 'Agent Chat' },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#027DDB]">Agent Management</h1>
        <p className="text-gray-600">Manage your agent applications, referrals, and earnings.</p>
      </div>

      {/* Mobile/Tablet top tabs */}
      <div className="lg:hidden">
        <Tabs tabs={tabs} current={tab} onChange={setTab} />
      </div>

      {/* Desktop: Sidebar + Content */}
      <div className="hidden lg:grid lg:grid-cols-[16rem,1fr] lg:gap-6">
        {/* Left sidebar nav */}
        <aside className="h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center h-14 px-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-900">Agent Navigation</h2>
          </div>
          <nav className="p-3 space-y-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full text-left flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  tab === t.key
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {/* dot/icon */}
                <span className={`mr-2 h-2 w-2 rounded-full ${tab === t.key ? 'bg-blue-600' : 'bg-gray-300'}`} />
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <section className="space-y-6">
          {tab === 'applications' && <ApplicationsSection />}
          {tab === 'directory' && <AgentsDirectorySection />}
          {tab === 'stats' && <ReferralStatsSection />}
          {tab === 'earnings' && <ReferralEarningsSection />}
          {tab === 'referred' && <ReferredUsersSection />}
          {tab === 'payment' && <ReferralPaymentSection />}
          {tab === 'register' && <AgentRegisterUserSection />}
          {tab === 'chat' && <AgentChat />}
        </section>
      </div>

      {/* On small screens, render content below tabs */}
      <div className="lg:hidden space-y-6">
        {tab === 'applications' && <ApplicationsSection />}
        {tab === 'directory' && <AgentsDirectorySection />}
        {tab === 'stats' && <ReferralStatsSection />}
        {tab === 'earnings' && <ReferralEarningsSection />}
        {tab === 'referred' && <ReferredUsersSection />}
        {tab === 'payment' && <ReferralPaymentSection />}
        {tab === 'register' && <AgentRegisterUserSection />}
        {tab === 'chat' && <AgentChat />}
      </div>
    </div>
  );
};

export default AgentManagement;
