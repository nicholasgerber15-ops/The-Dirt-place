import React, { useState, useEffect, useCallback } from 'react';
import { Mail, MessageSquare, Save, Plus, Trash2, Edit } from 'lucide-react';
import axios from 'axios';
import { businessInfo } from '../../data/mock';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

const NotificationTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    subject: '',
    content: '',
    is_active: true
  });
  const [saveMessage, setSaveMessage] = useState('');

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/notification-templates`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveMessage('');

    try {
      if (editingTemplate) {
        await axios.put(
          `${API}/admin/notification-templates/${editingTemplate.id}`,
          formData,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }
        );
        setSaveMessage('Template updated successfully!');
      } else {
        await axios.post(
          `${API}/admin/notification-templates`,
          formData,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }
        );
        setSaveMessage('Template created successfully!');
      }

      setFormData({
        name: '',
        type: 'email',
        subject: '',
        content: '',
        is_active: true
      });
      setEditingTemplate(null);
      setShowEditor(false);
      fetchTemplates();

      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage(error.response?.data?.detail || 'Failed to save template');
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      content: template.content,
      is_active: template.is_active
    });
    setShowEditor(true);
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await axios.delete(`${API}/admin/notification-templates/${templateId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: 'email',
      subject: '',
      content: '',
      is_active: true
    });
    setShowEditor(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D9A441]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Notification Templates
            </h1>
            <p className="text-[#6B4F3F] mt-2">Manage SMS and email templates for automated notifications</p>
          </div>
          <button
            onClick={handleNewTemplate}
            className="bg-[#D9A441] text-[#3B2F2F] px-6 py-3 rounded-lg font-bold hover:bg-[#c48f35] transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New Template</span>
          </button>
        </div>

        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${saveMessage.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {saveMessage}
          </div>
        )}

        {showEditor && (
          <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-[#3B2F2F] mb-6">
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[#3B2F2F] font-bold mb-2">Template Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F] rounded-lg focus:outline-none focus:border-[#D9A441]"
                    placeholder="e.g., Post-Delivery Review Request"
                  />
                </div>
                <div>
                  <label className="block text-[#3B2F2F] font-bold mb-2">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F] rounded-lg focus:outline-none focus:border-[#D9A441]"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>

              {formData.type === 'email' && (
                <div>
                  <label className="block text-[#3B2F2F] font-bold mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F] rounded-lg focus:outline-none focus:border-[#D9A441]"
                    placeholder="Email subject line"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#3B2F2F] font-bold mb-2">
                  Content
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (Use placeholders: {'{name}'}, {'{order_number}'}, {'{review_link}'})
                  </span>
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows="8"
                  className="w-full px-4 py-3 border-2 border-[#6B4F3F] rounded-lg focus:outline-none focus:border-[#D9A441] font-mono text-sm"
                  placeholder={formData.type === 'email' 
                    ? '<h1>Thank you, {name}!</h1><p>Your order {order_number} has been delivered.</p><p>Please leave us a review: {review_link}</p>'
                    : 'Hi {name}, your order {order_number} has been delivered! Please leave us a review: {review_link}'
                  }
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#D9A441] rounded focus:ring-[#D9A441]"
                />
                <label className="text-[#3B2F2F] font-medium">Active</label>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-[#D9A441] text-[#3B2F2F] px-8 py-3 rounded-lg font-bold hover:bg-[#c48f35] transition-colors flex items-center space-x-2"
                >
                  <Save size={20} />
                  <span>{editingTemplate ? 'Update' : 'Create'} Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditor(false);
                    setEditingTemplate(null);
                  }}
                  className="bg-gray-300 text-gray-800 px-8 py-3 rounded-lg font-bold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  {template.type === 'email' ? (
                    <Mail className="text-[#D9A441]" size={24} />
                  ) : (
                    <MessageSquare className="text-[#D9A441]" size={24} />
                  )}
                  <h3 className="text-xl font-bold text-[#3B2F2F]">{template.name}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {template.subject && (
                <p className="text-[#6B4F3F] mb-2"><strong>Subject:</strong> {template.subject}</p>
              )}

              <div className="bg-gray-50 p-3 rounded-lg mb-4 max-h-32 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{template.content}</pre>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 bg-[#3B2F2F] text-[#FAF9F6] px-4 py-2 rounded-lg font-medium hover:bg-[#2a2222] transition-colors flex items-center justify-center space-x-1"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && !showEditor && (
          <div className="text-center py-12">
            <Mail className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-xl text-gray-600">No templates yet. Create your first notification template!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationTemplatesPage;
