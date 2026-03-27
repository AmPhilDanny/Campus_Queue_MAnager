"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { useToast } from "@/components/Toast";
import { SkeletonBlock } from "@/components/Skeleton";
import { Plus, Trash2, GripVertical, Settings2, Save } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export default function FormManagementPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    label: "",
    type: "text",
    required: true,
    placeholder: "",
    options: "",
    order: 0
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/admin/form-fields")
      .then(r => r.json())
      .then(data => {
        setFields(data);
        setLoading(false);
      })
      .catch(() => {
        showToast("Failed to load form fields.", "error");
        setLoading(false);
      });
  }, []);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state with new orders
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));
    setFields(updatedItems);

    // Sync with backend
    try {
      const res = await fetch("/api/admin/form-fields", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: updatedItems.map(f => ({ id: f.id, order: f.order }))
        }),
      });
      if (!res.ok) {
        showToast("Failed to save new order.", "error");
        // Optionally revert state here
      } else {
        showToast("Order saved.", "success");
      }
    } catch {
      showToast("Network error while reordering.", "error");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/form-fields/${editingField.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Field updated.", "success");
        setFields(fields.map(f => f.id === data.id ? data : f).sort((a,b) => a.order - b.order));
        setEditingField(null);
      } else {
        showToast(data.error || "Failed to update field.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this field? Data in existing tickets will be preserved but the field will disappear from the form.")) return;
    try {
      const res = await fetch(`/api/admin/form-fields/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Field deleted.", "success");
        setFields(fields.filter(f => f.id !== id));
      } else {
        showToast("Failed to delete field.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/form-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Field added successfully.", "success");
        setFields(prev => [...prev, data].sort((a,b) => a.order - b.order));
        setShowAddModal(false);
        setFormData({ name: "", label: "", type: "text", required: true, placeholder: "", options: "", order: fields.length + 1 });
      } else {
        showToast(data.error || "Failed to add field.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  return (
    <div className="admin-container">
      <AdminNav />
      <main className="admin-main">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <div style={{ marginBottom: "0.5rem" }}>
              <Link href="/admin/dashboard" className="btn btn-ghost" style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", gap: "0.4rem" }}>
                ← Return to Dashboard
              </Link>
            </div>
            <h1 style={{ fontSize: "1.5rem" }}>Ticket Form Management</h1>
            <p style={{ color: "var(--text-muted)" }}>Customize the registration form for students.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} style={{ marginRight: "0.5rem" }} />
            Add Field
          </button>
        </header>

      {loading ? (
        <SkeletonBlock height="200px" />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="form-fields">
              {(provided) => (
                <div 
                  className="fields-list" 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                >
                  {fields.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`field-item ${snapshot.isDragging ? 'dragging' : ''}`}
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            padding: "1rem", 
                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                            gap: "1rem",
                            background: snapshot.isDragging ? "rgba(255,255,255,0.05)" : "transparent",
                            ...provided.draggableProps.style
                          }}
                        >
                          <div {...provided.dragHandleProps} style={{ display: "flex", alignItems: "center", cursor: "grab" }}>
                            <GripVertical size={18} style={{ color: "var(--text-muted)" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{field.label} {field.required && <span style={{ color: "var(--error)" }}>*</span>}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              Type: {field.type} | Machine Name: {field.name}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button 
                              className="btn btn-ghost" 
                              style={{ padding: "0.5rem" }} 
                              title="Edit"
                              onClick={() => {
                                setEditingField(field);
                                setFormData(field);
                              }}
                            >
                              <Settings2 size={16} />
                            </button>
                            <button 
                              className="btn btn-ghost" 
                              style={{ padding: "0.5rem", color: "var(--error)" }} 
                              title="Delete"
                              onClick={() => handleDelete(field.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          {fields.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              No custom fields defined yet.
            </div>
          )}
        </div>
      )}

      {(showAddModal || editingField) && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h2>{editingField ? "Edit Form Field" : "Add Custom Form Field"}</h2>
            <form onSubmit={editingField ? handleUpdate : handleCreate}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Label (Display Name)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Matric Number" 
                    value={formData.label}
                    onChange={e => setFormData({...formData, label: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Internal Name (Code)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. student_id" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required 
                    disabled={!!editingField} // Don't allow changing internal name once created
                  />
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Field Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="text">Short Text</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="textarea">Long Text / Textarea</option>
                    <option value="select">Dropdown / Select</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Required?</label>
                  <select value={formData.required ? "yes" : "no"} onChange={e => setFormData({...formData, required: e.target.value === 'yes'})}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Placeholder Text</label>
                <input 
                  type="text" 
                  value={formData.placeholder || ""}
                  onChange={e => setFormData({...formData, placeholder: e.target.value})}
                />
              </div>

              {formData.type === "select" && (
                <div className="form-group">
                  <label>Options (Comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="Option 1, Option 2, Option 3" 
                    value={formData.options || ""}
                    onChange={e => setFormData({...formData, options: e.target.value})}
                    required
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingField ? "Save Changes" : "Add Field"}
                </button>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingField(null);
                    setFormData({ name: "", label: "", type: "text", required: true, placeholder: "", options: "", order: fields.length });
                  }} 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </main>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          width: 100%;
          max-width: 500px;
        }
        .field-item:last-child {
          border-bottom: none;
        }
        .field-item:hover {
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </div>
  );
}
