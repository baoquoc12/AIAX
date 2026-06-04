export const workflowDocuments = [
  {
    id: 'production-pipeline',
    title: 'Production Pipeline.xlsx',
    role: 'Bản đồ quy trình sản xuất',
    source: 'doucument_firm/Production Pipeline.xlsx',
    summary: 'Quy định luồng làm phim AIAX từ chọn ý tưởng đến Sign-off, gồm input, output, nhân sự, QC và các điểm lock.',
  },
  {
    id: 'prompt-engine',
    title: 'Prompt Engine.docx',
    role: 'Bộ prompt phát triển kịch bản',
    source: 'doucument_firm/Prompt Engine.docx',
    summary: 'Biến ý tưởng thô thành Pitch Deck, Screenplay và QAQC Report qua 3 lượt prompt có kiểm soát.',
  },
  {
    id: 'script-sop',
    title: 'AIAX.STUDIO SOP',
    role: 'Quy chuẩn kịch bản cho sản xuất AI',
    source: 'doucument_firm/TÀI LIỆU QUY CHUẨN KỊCH BẢN PHIM AI (AIAX.STUDIO SOP).docx',
    summary: 'Đặt rule bắt buộc: một câu là một shot, Action phải tả thực, dùng The Set và cấu trúc Save The Cat rút gọn.',
  },
  {
    id: 'structure-foundation',
    title: 'Tài liệu cấu trúc kịch bản',
    role: 'Nền tảng chuyên môn điện ảnh',
    source: 'doucument_firm/Các yếu tố cấu trúc kịch bản ... .docx',
    summary: 'Giải thích cấu trúc scene, Title, Tagline, Logline, Synopsis, Three Acts, Inverted Structure và Circular Structure.',
  },
]

export const pipelineStages = [
  {
    id: 'pre-production',
    title: 'Pre-Production',
    estimate: '~1 ngày',
    sections: [
      {
        id: 'script-development',
        title: '1.1 Phát triển kịch bản',
        steps: [
          { no: '1.0', name: 'Ý tưởng', action: 'Chọn một ý tưởng từ AIAX Matrix. Giai đoạn này chưa cần pitch.', input: 'AIAX Matrix Expanded', output: 'Ý tưởng được chọn, code thể loại, brief tóm tắt', owner: 'Biên kịch', gate: null },
          { no: '2.0', name: 'Synopsis', action: 'Tạo Pitch Deck từ ý tưởng thô bằng Prompt Engine, SOP và tài liệu cấu trúc kịch bản.', input: 'Ý tưởng thô, Prompt Engine, SOP, tài liệu cấu trúc kịch bản', output: 'Title, Tagline, Logline, Vision, Synopsis, Hook Check', owner: 'Biên kịch + AI', gate: 'Hoàn tất Prompt 01' },
          { no: '3.0', name: 'Screenplay V1', action: 'Tạo bản kịch bản đầy đủ đầu tiên từ Synopsis và cấu trúc câu chuyện.', input: 'Toàn bộ output Prompt 01, thời lượng mục tiêu, SOP', output: 'Screenplay V1', owner: 'Biên kịch + AI', gate: 'Có format The Set' },
          { no: '4.0', name: 'Feedback Beat & Dialogue', action: 'Đạo diễn duyệt nhịp, thoại, độ mạnh của hook và khả năng sản xuất bằng AI.', input: 'Screenplay V1', output: 'Ghi chú feedback', owner: 'Đạo diễn + Biên kịch', gate: null },
          { no: '5.0', name: 'Screenplay V2', action: 'Biên kịch viết lại các lỗi và áp dụng feedback từ đạo diễn.', input: 'Ghi chú feedback + Screenplay V1', output: 'Screenplay V2', owner: 'Biên kịch', gate: 'QAQC >= 40/50, không còn mục đỏ' },
          { no: '6.0', name: 'Script Lock', action: 'Đạo diễn duyệt kịch bản cuối. Sau điểm này không đổi story, beat hoặc cấu trúc thoại.', input: 'Screenplay V2', output: '[TEN_KICH_BAN]_LOCKED.docx', owner: 'Đạo diễn + Biên kịch', gate: 'LOCK' },
        ],
      },
      {
        id: 'treatment-storyboard',
        title: '1.2 Treatment & Storyboard',
        steps: [
          { no: '7.0', name: 'Breakdown & Treatment', action: 'Đạo diễn breakdown scene, ý đồ, nhịp thị giác và treatment notes.', input: 'Locked script', output: 'Scene breakdown + treatment notes', owner: 'Đạo diễn', gate: null },
          { no: '8.0', name: 'Visual Reference & Design', action: 'Tạo moodboard, character design và environment reference theo chỉ đạo đạo diễn.', input: 'Script, tone, visual prompts', output: 'Moodboard + design/reference sheets', owner: 'Đạo diễn + AI', gate: null },
          { no: '9.0', name: 'Shot List & Visual Prompts', action: 'Đạo diễn viết Shot List và visual prompt chi tiết. Không feedback ngược lại biên kịch.', input: 'Treatment, reference sheets, bộ prompt', output: 'Shot List + prompt text chi tiết', owner: 'Đạo diễn + AI', gate: 'Một action = một shot' },
          { no: '10.0', name: 'Storyboard', action: 'Tạo storyboard panels từ Shot List và AI prompts.', input: 'Shot List + AI prompts', output: 'Storyboard panels có timecode', owner: 'Đạo diễn + AI', gate: null },
          { no: '11.0', name: 'Storyboard Lock', action: 'Team duyệt storyboard cuối. Editor nhận bản storyboard để sản xuất.', input: 'Storyboard panels', output: 'Storyboard FINAL', owner: 'Editor + Đạo diễn', gate: 'LOCK' },
        ],
      },
    ],
  },
  {
    id: 'production',
    title: 'Production',
    estimate: '~1 ngày',
    sections: [
      {
        id: 'video-generation',
        title: '2.1 Video Generation',
        steps: [
          { no: '12.0', name: 'Test Shots', action: 'Gen 3-5 test shots để xác nhận model, style, motion setting và negative prompt.', input: 'Prompts mẫu', output: 'Bộ video testing', owner: 'Editor + AI', gate: 'Bắt buộc trước batch generation' },
          { no: '13.0', name: 'Main Shots', action: 'Gen toàn bộ shot chính theo storyboard đã lock.', input: 'Prompts chuẩn của Shot List', output: 'Raw video clips', owner: 'Editor + AI', gate: null },
          { no: '14.0', name: 'B-roll & Cutaway', action: 'Gen các shot phụ, cutaway, insert và atmosphere shots.', input: 'B-roll list', output: 'B-roll clips', owner: 'AI Gen', gate: null },
          { no: '15.0', name: 'Shot QC', action: 'Chọn best take và đánh dấu shot lỗi để re-gen.', input: 'Raw clips', output: 'Best take list + re-gen queue', owner: 'Editor + Đạo diễn', gate: 'QC' },
          { no: '16.0', name: 'Re-Gen Shots', action: 'Re-gen các shot lỗi bằng prompt đã chỉnh.', input: 'Shot errors + adjusted prompts', output: 'Approved clips', owner: 'Editor + AI', gate: null },
        ],
      },
      {
        id: 'audio-generation',
        title: '2.2 Voice Over & Audio Generation',
        steps: [
          { no: '17.0', name: 'Gen VO', action: 'Gen toàn bộ voice-over từ VO script đã duyệt.', input: 'VO script + voice profile', output: 'VO audio files', owner: 'Editor + AI', gate: null },
          { no: '18.0', name: 'VO QC', action: 'Nghe kiểm tra phát âm, nhịp, cảm xúc và độ rõ.', input: 'VO audio files', output: 'Best VO take list', owner: 'Editor + AI', gate: 'QC' },
          { no: '19.0', name: 'Re-Gen VO', action: 'Re-gen các câu VO phát âm sai hoặc yếu cảm xúc.', input: 'VO errors + adjusted prompts', output: 'Clean VO audio', owner: 'Editor + AI', gate: null },
          { no: '20.0', name: 'SFX & Music + Mix', action: 'Gen hoặc thu thập SFX/music và dựng audio timeline hoàn chỉnh.', input: 'SFX list, music brief, VO', output: 'Audio timeline hoàn chỉnh', owner: 'Editor + AI', gate: null },
        ],
      },
      {
        id: 'assembly',
        title: '2.3 Assembly, Rough Cut, Fine Cut, Finishing',
        steps: [
          { no: '21.0', name: 'Assembly & Rough Cut', action: 'Nhập assets, tổ chức timeline, rough cut theo storyboard và sync VO.', input: 'Video, VO, SFX, music, B-roll', output: 'Rough cut V1', owner: 'Editor', gate: null },
          { no: '22.0', name: 'Color Grading & Audio Mix', action: 'Color grading và cân bằng VO/music/SFX.', input: 'Rough cut + moodboard', output: 'Fine cut', owner: 'Editor', gate: null },
          { no: '23.0', name: 'Fine Cut Review', action: 'Team Creative screening để kiểm tra nhịp, rõ nghĩa và cảm xúc.', input: 'Fine cut', output: 'Ghi chú feedback creative', owner: 'Team Creative', gate: 'Review' },
          { no: '24.0', name: 'Minor Fixes / Picture Lock', action: 'Áp dụng minor fixes và Picture Lock. Sau điểm này không đổi cấu trúc dựng.', input: 'Ghi chú feedback', output: 'Picture Lock', owner: 'Editor', gate: 'LOCK' },
        ],
      },
    ],
  },
  {
    id: 'post-production',
    title: 'Post-Production',
    estimate: '~1 ngày',
    sections: [
      {
        id: 'review-delivery',
        title: '3.1 Review & Delivery',
        steps: [
          { no: '25.0', name: 'Round 1: Director Check', action: 'Đạo diễn review bản Picture Lock và đưa ghi chú cuối.', input: 'Picture Lock', output: 'Ghi chú feedback của đạo diễn', owner: 'Đạo diễn', gate: 'Review' },
          { no: '26.0', name: 'Round 2: Creative Check', action: 'Team Creative kiểm tra lần cuối và duyệt final.', input: 'Feedback đạo diễn + Picture Lock', output: 'Duyệt final', owner: 'Team Creative', gate: 'Review' },
          { no: '27.0', name: 'Sign-off', action: 'Export master và bàn giao đúng định dạng yêu cầu.', input: 'Duyệt final', output: 'Sẵn sàng bàn giao', owner: 'Editor', gate: 'LOCK' },
        ],
      },
    ],
  },
]

export const promptEngineSteps = [
  {
    id: 'generate-synopsis',
    title: 'Prompt 01: Generate Synopsis',
    input: 'Ý tưởng thô, 1-5 câu',
    output: 'Title, Tagline, Logline, Vision, Synopsis, Hook Check',
    purpose: 'Dựng Pitch Deck hoàn chỉnh trước khi viết kịch bản.',
    template: [
      'Bạn là AI Script Development Engine chuyên nghiệp của AIAX.Studio.',
      'Nhiệm vụ của bạn chưa phải viết kịch bản, mà là xây dựng Pitch Deck hoàn chỉnh từ ý tưởng thô.',
      'Ý tưởng thô: [DÁN Ý TƯỞNG THÔ VÀO ĐÂY]',
      'Xuất đủ các mục: TITLE, TAGLINE, LOGLINE, VISION, SYNOPSIS, HOOK CHECK.',
      'Hook Check phải tự kiểm tra: độ rõ, hook cảm xúc, khả năng sản xuất hình ảnh bằng AI, và độ hợp thị trường.',
    ].join('\n'),
  },
  {
    id: 'generate-screenplay',
    title: 'Prompt 02: Generate Screenplay',
    input: 'Toàn bộ output Prompt 01 + thời lượng mục tiêu + SOP',
    output: 'Kịch bản sẵn sàng sản xuất',
    purpose: 'Viết screenplay theo The Set và giới hạn sản xuất AI.',
    template: [
      'Đóng vai biên kịch AI chuyên nghiệp của AIAX.Studio.',
      'Dựa vào AIAX SOP đính kèm và toàn bộ Pitch Deck bên dưới.',
      'Thời lượng mục tiêu: [THỜI LƯỢNG]',
      'Định dạng output: [docx/pdf/txt/fdx]',
      'Rule: một câu = một shot; Action phải tả thực; dùng The Set; hạn chế tương tác vật lý phức tạp.',
      'Dán toàn bộ output Prompt 01 tại đây: [FULL PITCH DECK]',
    ].join('\n'),
  },
  {
    id: 'qaqc-screenplay',
    title: 'Prompt 03: QAQC Screenplay',
    input: 'Toàn bộ screenplay từ Prompt 02',
    output: 'QAQC Report có điểm /50 và trạng thái xanh/vàng/đỏ',
    purpose: 'Kiểm tra kịch bản trước Script Lock.',
    template: [
      'Kiểm tra FILE KỊCH BẢN dựa trên AIAX.Studio SOP đính kèm.',
      'Chấm điểm /50 và phân loại từng lỗi thành XANH, VÀNG hoặc ĐỎ.',
      'Kịch bản chỉ đạt khi >= 40/50 và không còn mục ĐỎ.',
      'Kiểm tra format, one-shot action, độ tả thực, khả năng sản xuất AI, và cấu trúc beat.',
      'Dán toàn bộ screenplay tại đây: [FULL SCREENPLAY]',
    ].join('\n'),
  },
]

export const sopRules = [
  { id: 'one-sentence-one-shot', title: 'Một câu = một hình / một shot', severity: 'Bắt buộc', detail: 'Mỗi câu Action phải tương ứng với một shot cụ thể. Không gộp nhiều hành động liên tiếp vào một câu.' },
  { id: 'concrete-not-abstract', title: 'Tả thực, không định tính', severity: 'Bắt buộc', detail: 'Dùng hành động, âm thanh, ánh sáng, màu sắc, vị trí cơ thể, biểu cảm và đạo cụ có thể nhìn thấy. Tránh các từ trừu tượng như sang trọng, buồn bã, tinh tế nếu chưa chuyển thành hình ảnh cụ thể.' },
  { id: 'avoid-physical-complexity', title: 'Giảm tương tác vật lý phức tạp', severity: 'Bắt buộc', detail: 'AI video xử lý kém va chạm chi tiết, đánh nhau đông người, tay chạm tay chính xác. Dùng cutaway, close-up, silhouette, insert và transition để lướt qua giới hạn này.' },
  { id: 'the-set', title: 'The Set: 5 phần bắt buộc', severity: 'Bắt buộc', detail: 'Mỗi scene phải có Scene Heading, Action, Character, Dialog, Transition.' },
  { id: 'scene-heading', title: 'Scene Heading đúng format', severity: 'Bắt buộc', detail: 'Dùng heading in hoa, đánh số: INT/EXT - ĐỊA ĐIỂM - DAY/NIGHT.' },
  { id: 'save-the-cat', title: 'Save The Cat rút gọn', severity: 'Bắt buộc', detail: 'Phim AI ngắn cần đánh dấu các beat: Opening Image, Set-up, Catalyst/Debate, Break into Two, Fun & Games, Midpoint, All Is Lost, Finale, Final Image.' },
]

export const qaqcRubric = [
  { title: 'Format The Set', points: 10, check: 'Scene Heading, Action, Character, Dialog, Transition có đủ và dễ đọc.' },
  { title: 'Kỷ luật one-shot action', points: 10, check: 'Mỗi câu Action map được thành một hình/shot cụ thể.' },
  { title: 'Độ tả thực hình ảnh', points: 10, check: 'Mô tả đủ rõ về hình ảnh, âm thanh, ánh sáng, hành động và đạo cụ.' },
  { title: 'Cấu trúc beat', points: 10, check: 'Có Save The Cat rút gọn và cung cảm xúc rõ.' },
  { title: 'Khả năng sản xuất bằng AI', points: 10, check: 'Tránh continuity bất khả thi, va chạm phức tạp, crowd dày và motion mơ hồ.' },
]

export const lockPoints = [
  { title: 'Script Lock', after: 'Screenplay V2', rule: 'Không đổi story, beat hoặc cấu trúc thoại sau khi duyệt.' },
  { title: 'Storyboard Lock', after: 'Storyboard FINAL', rule: 'Không đổi Shot List sau khi duyệt. Chỉ sửa lỗi thực thi.' },
  { title: 'Picture Lock', after: 'Minor fixes của Fine Cut', rule: 'Không đổi cấu trúc dựng sau điểm này.' },
  { title: 'Sign-off', after: 'Creative approval', rule: 'Chỉ export master và định dạng bàn giao.' },
]
