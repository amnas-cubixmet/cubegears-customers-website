import { CheckCircle2, Clock3, Download, FileText, Wrench } from 'lucide-react';
import { portalApi } from '../api';
import { niceDate, rupees, stages } from '../i18n';
import { invoicePaymentLabel } from '../portalBilling';

function Timeline({ job, t }) {
  const current = Math.max(0, stages.indexOf(job.stage));
  return (
    <ol className="timeline" aria-label={t.step}>
      {stages.map((stage, index) => (
        <li className={index <= current ? 'done' : ''} aria-current={index === current ? 'step' : undefined} key={stage}>
          <span>{index <= current ? <CheckCircle2 size={17}/> : <span className="empty-dot"/>}</span>
          {t[stage] || stage}
        </li>
      ))}
    </ol>
  );
}

export function ActiveJobRecords({ jobs, t, lang }) {
  return (
    <section className="surface">
      <div className="section-head"><Wrench size={20} aria-hidden="true"/><h2>{t.active}</h2><span>{jobs.length}</span></div>
      {jobs.map(job => (
        <article className="job" key={job.id}>
          <div className="job-top">
            <div><small>{job.number}</small><h3>{job.vehicleRegistration}</h3><p>{job.vehicleModel}</p></div>
            <span className="tag">{t[job.stage] || job.status}</span>
          </div>
          <Timeline job={job} t={t}/>
          <small className="date">{t.date}: {niceDate(job.createdAt, lang)}</small>
        </article>
      ))}
      {!jobs.length && <p className="muted">{t.noData}</p>}
    </section>
  );
}

export function ServiceHistoryRecords({ jobs, t, lang }) {
  return (
    <section className="surface">
      <div className="section-head"><Clock3 size={20} aria-hidden="true"/><h2>{t.history}</h2></div>
      {jobs.map(job => (
        <div className="history" key={job.id}>
          <strong>{job.vehicleRegistration}</strong><span>{job.number}</span>
          <small>{t[job.stage] || job.status} · {niceDate(job.createdAt, lang)}</small>
        </div>
      ))}
      {!jobs.length && <p className="muted">{t.noData}</p>}
    </section>
  );
}

export function InvoiceRecords({ invoices, totals, t, children }) {
  return (
    <section className="surface">
      <div className="section-head"><FileText size={20} aria-hidden="true"/><h2>{t.documents}</h2></div>
      {invoices.map(invoice => (
        <div className="document portal-document" key={invoice.id || invoice.number}>
          <div>
            <strong>{invoice.number}</strong>
            <small>{invoicePaymentLabel(invoice, t)}</small>
            <small>{t.paidAmount}: {rupees(invoice.paid)} · {t.balanceDue}: {rupees(invoice.balance)}</small>
          </div>
          <aside className="portal-document-actions">
            <b>{rupees(invoice.total)}</b>
            {invoice.id && <a className="btn btn-outline" href={portalApi.invoicePdfUrl(invoice.id)} download>
              <Download size={17} aria-hidden="true"/>{t.downloadPdf}
            </a>}
          </aside>
        </div>
      ))}
      {!invoices.length && <p className="muted">{t.noData}</p>}
      {totals.count > 0 && <div className="portal-balance-summary">
        <h3>{t.invoiceOverview}</h3>
        <div><span>{t.invoiced}</span><strong>{rupees(totals.total)}</strong></div>
        <div><span>{t.paidAmount}</span><strong>{rupees(totals.paid)}</strong></div>
        <div className="portal-due"><span>{t.balanceDue}</span><strong>{rupees(totals.outstanding)}</strong></div>
        <p>{t.balanceNote}</p>
      </div>}
      {children}
    </section>
  );
}
