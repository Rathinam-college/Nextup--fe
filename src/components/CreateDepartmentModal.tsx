import React, { useState, useEffect } from 'react';
import { Department } from '../types';
import { api } from '../services/api';
import { X, Building, AlertCircle } from 'lucide-react';

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  editingDepartment?: Department | null;
}

export const CreateDepartmentModal: React.FC<CreateDepartmentModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  editingDepartment,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingDepartment) {
      setName(editingDepartment.name);
      setCode(editingDepartment.code);
      setDescription(editingDepartment.description || '');
    } else {
      setName('');
      setCode('');
      setDescription('');
    }
    setError(null);
  }, [editingDepartment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Please provide both department name and a unique department code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (editingDepartment) {
        await api.updateDepartment(editingDepartment.id, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
        });
      } else {
        await api.createDepartment({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
        });
      }
      setName('');
      setCode('');
      setDescription('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${editingDepartment ? 'update' : 'create'} department.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notion-modal-overlay" onClick={onClose}>
      <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', borderRadius: '18px' }}>
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--notion-border)',
            background: 'var(--notion-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(99, 102, 241, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--notion-blue)',
            }}>
              <Building size={17} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
                {editingDepartment ? `Edit Department: ${editingDepartment.name}` : 'Create Operating Department'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                Organizational unit configuration & routing code
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="notion-btn"
            style={{ padding: '6px', borderRadius: '8px', color: 'var(--notion-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '22px 24px' }}>
            {error && (
              <div className="notion-callout notion-callout-danger" style={{ marginBottom: '18px', borderRadius: '10px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                Department Name
              </label>
              <input
                type="text"
                required
                autoFocus
                className="notion-input"
                placeholder="e.g. Human Resources, Finance, Legal, Operations"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ fontSize: '13.5px', borderRadius: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                Department Code (Short Identifier)
              </label>
              <input
                type="text"
                required
                maxLength={10}
                className="notion-input"
                placeholder="e.g. HR, FIN, LEG, OPS"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{ fontFamily: 'JetBrains Mono', textTransform: 'uppercase', fontSize: '13.5px', borderRadius: '8px', letterSpacing: '0.05em' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                Description & Scope
              </label>
              <textarea
                className="notion-textarea"
                placeholder="Describe this department's functions and operational scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ fontSize: '13px', borderRadius: '8px', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--notion-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: 'var(--notion-hover)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="notion-btn notion-btn-bordered"
              disabled={loading}
              style={{ borderRadius: '8px', padding: '7px 16px', fontSize: '12.5px', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="notion-btn notion-btn-primary"
              disabled={loading}
              style={{
                borderRadius: '8px',
                padding: '7px 18px',
                fontSize: '12.5px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              {loading
                ? editingDepartment ? 'Saving...' : 'Creating...'
                : editingDepartment ? 'Save Changes' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
