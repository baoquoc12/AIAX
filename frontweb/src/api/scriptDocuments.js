import request from '@/utils/request'

export const scriptDocumentsAPI = {
  list(dramaId, params = {}) {
    return request.get(`/dramas/${dramaId}/script-documents`, { params })
  },
  latest(dramaId, params = {}) {
    return request.get(`/dramas/${dramaId}/script-documents/latest`, { params })
  },
  create(dramaId, data = {}) {
    return request.post(`/dramas/${dramaId}/script-documents`, data)
  },
  update(id, data = {}) {
    return request.put(`/script-documents/${id}`, data)
  },
}
