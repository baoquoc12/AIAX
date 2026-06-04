import request from '@/utils/request'

export const pipelineAPI = {
  listSteps(dramaId, params = {}) {
    return request.get(`/dramas/${dramaId}/pipeline-steps`, { params })
  },
  saveStep(dramaId, stepKey, data = {}) {
    return request.put(`/dramas/${dramaId}/pipeline-steps/${stepKey}`, data)
  },
}
