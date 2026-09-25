import { apiClient } from '../client';
import { DocumentItem } from '../../types';
import { UploadDocumentRequest } from '../../types/api';
import { initialDocuments } from '../../data/mockData';

export const documentService = {
  async getDocuments(goalId?: string): Promise<DocumentItem[]> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(150);
      if (goalId) {
        return initialDocuments.filter((d) => d.goalId === goalId);
      }
      return initialDocuments;
    }
    const query = goalId ? `?goalId=${goalId}` : '';
    const res = await apiClient.get<DocumentItem[]>(`/documents${query}`);
    return res.data;
  },

  async uploadDocument(payload: UploadDocumentRequest): Promise<DocumentItem> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(300);
      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        goalId: payload.goalId,
        title: payload.title,
        category: payload.category,
        status: 'verified',
        requiredFor: payload.requiredFor,
        fileName: payload.fileName,
        uploadedAt: 'Just now',
        fileSize: '1.8 MB',
      };
      return newDoc;
    }

    const formData = new FormData();
    formData.append('goalId', payload.goalId);
    formData.append('title', payload.title);
    formData.append('category', payload.category);
    formData.append('requiredFor', payload.requiredFor);
    if (payload.file) {
      formData.append('file', payload.file);
    }

    const res = await fetch(`${(apiClient as any).baseUrl}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    return json.data;
  },

  async deleteDocument(id: string): Promise<boolean> {
    if (apiClient.getMode() === 'mock') {
      await apiClient.simulateDelay(100);
      return true;
    }
    await apiClient.delete(`/documents/${id}`);
    return true;
  },
};
