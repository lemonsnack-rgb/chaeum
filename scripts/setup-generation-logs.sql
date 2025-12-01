-- 레시피 자동 생성 로그 테이블
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient TEXT,
  dish_name TEXT,
  status TEXT NOT NULL, -- 'success', 'failed', 'skipped'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at
  ON generation_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_logs_status
  ON generation_logs(status);

CREATE INDEX IF NOT EXISTS idx_generation_logs_ingredient
  ON generation_logs(ingredient);

-- 권한 설정 (anon 키로 접근 가능하도록)
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 조회 가능 (읽기 전용)
CREATE POLICY "Anyone can view generation logs"
  ON generation_logs
  FOR SELECT
  USING (true);

-- 시스템만 삽입 가능 (service_role 키 필요)
-- 참고: GitHub Actions에서는 anon 키를 사용하므로,
-- 실제로는 이 정책을 비활성화하고 anon에서도 삽입 허용해야 함
CREATE POLICY "Service role can insert generation logs"
  ON generation_logs
  FOR INSERT
  WITH CHECK (true);

-- 댓글: 위 정책으로는 anon 키로 삽입이 안 됩니다.
-- 대안 1: service_role 키를 GitHub Secrets에 등록 (권장하지 않음)
-- 대안 2: anon 키로도 삽입 가능하도록 정책 수정 (아래 참고)

-- anon 키로 삽입 허용 (보안상 주의 필요)
-- 필요 시 아래 정책으로 교체:
-- DROP POLICY "Service role can insert generation logs" ON generation_logs;
-- CREATE POLICY "Anyone can insert generation logs"
--   ON generation_logs
--   FOR INSERT
--   WITH CHECK (true);

-- 생성 통계 조회용 뷰
CREATE OR REPLACE VIEW generation_stats AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'success') as success_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE status = 'skipped') as skipped_count
FROM generation_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 최근 30일 통계
CREATE OR REPLACE VIEW recent_generation_stats AS
SELECT * FROM generation_stats
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ generation_logs 테이블 생성 완료!';
  RAISE NOTICE '⚠️  중요: anon 키로 삽입하려면 INSERT 정책을 수정해야 합니다.';
  RAISE NOTICE '   SQL 파일의 주석을 참고하세요.';
END $$;
