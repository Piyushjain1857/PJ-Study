import React, { useState, useEffect, useCallback } from 'react';
import { platformConfigService } from '../../../services/platformConfigService.js';
import { usePlatformConfig } from '../../../context/PlatformConfigContext.jsx';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Input from '../../../components/common/Input.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';

export function ContentManagerTab({ onNotify }) {
  const { reloadConfig } = usePlatformConfig();
  const [blocks, setBlocks] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadBlocks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await platformConfigService.getContentBlocks();
      setBlocks(data || []);
      if (data && data.length > 0 && !activeKey) {
        setActiveKey(data[0].key);
        setEditData(data[0]);
      }
    } catch (err) {
      onNotify?.({ type: 'danger', message: `Failed to load content blocks: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  }, [activeKey, onNotify]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const handleSelectBlock = (block) => {
    setActiveKey(block.key);
    setEditData(block);
  };

  const handleSave = async () => {
    if (!activeKey) return;
    setIsSaving(true);
    try {
      await platformConfigService.updateContentBlock(activeKey, {
        title: editData.title,
        content: editData.content,
        isPublished: editData.isPublished
      });
      onNotify?.({ type: 'success', message: `Content block "${editData.title || activeKey}" saved successfully.` });
      await loadBlocks();
      await reloadConfig?.();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to save block.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <Skeleton count={4} height="80px" />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', minHeight: '600px' }}>
      {/* Left List of CMS Blocks */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)' }}>
          <strong style={{ fontSize: '13px' }}>Content Modules & Blocks</strong>
        </div>
        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {blocks.map((block) => (
            <div
              key={block.key}
              onClick={() => handleSelectBlock(block)}
              style={{
                padding: '12px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: activeKey === block.key ? '#f0fdfa' : 'transparent',
                border: activeKey === block.key ? '1px solid #0f766e' : '1px solid transparent',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{block.title || block.key}</strong>
                <Badge variant={block.isPublished ? 'success' : 'neutral'} size="sm">
                  {block.isPublished ? 'Live' : 'Draft'}
                </Badge>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Section: {block.section || 'General'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Content Editor Form */}
      {editData && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>
                {editData.title || editData.key}
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono, monospace)' }}>
                identifier: {editData.key} • Section: {editData.section}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
                Save Block
              </Button>
            </div>
          </div>

          <Input
            label="Module Title"
            value={editData.title || ''}
            onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
          />

          <div className="input-group">
            <label className="input-label">Content Body / Structured Data</label>
            <textarea
              className="admin-textarea"
              rows={12}
              style={{
                fontFamily: typeof editData.content === 'object' ? 'var(--font-mono, monospace)' : 'inherit',
                fontSize: '13px'
              }}
              value={
                typeof editData.content === 'object'
                  ? JSON.stringify(editData.content, null, 2)
                  : editData.content || ''
              }
              onChange={(e) => {
                const val = e.target.value;
                try {
                  const parsed = JSON.parse(val);
                  setEditData((prev) => ({ ...prev, content: parsed }));
                } catch {
                  setEditData((prev) => ({ ...prev, content: val }));
                }
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="cms-block-pub"
              checked={Boolean(editData.isPublished)}
              onChange={(e) => setEditData((prev) => ({ ...prev, isPublished: e.target.checked }))}
            />
            <label htmlFor="cms-block-pub" style={{ fontSize: '13px', fontWeight: 600 }}>
              Publish this content block live to the public and scholar workspaces
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentManagerTab;
