import { useState, useEffect } from 'react';
import { MessageCircle, Send, Edit2, Trash2, X } from 'lucide-react';
import { Comment, getRecipeComments, addComment, updateComment, deleteComment } from '../lib/commentService';

interface CommentSectionProps {
  recipeId: string;
  isAuthenticated: boolean;
  onLoginRequired: () => void;
}

export function CommentSection({ recipeId, isAuthenticated, onLoginRequired }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [guestNickname, setGuestNickname] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [recipeId]);

  async function loadComments() {
    setLoading(true);
    try {
      const data = await getRecipeComments(recipeId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newComment.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      if (isAuthenticated) {
        // 회원인 경우
        await addComment(recipeId, newComment);
      } else {
        // 비회원인 경우
        if (!guestNickname.trim()) {
          alert('닉네임을 입력해주세요');
          setSubmitting(false);
          return;
        }
        if (!guestPassword.trim()) {
          alert('비밀번호를 입력해주세요');
          setSubmitting(false);
          return;
        }
        await addComment(recipeId, newComment, guestNickname, guestPassword);
        setGuestNickname('');
        setGuestPassword('');
      }
      setNewComment('');
      await loadComments();
    } catch (error: any) {
      alert(error.message || '댓글 추가 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(commentId: string, isGuest: boolean) {
    if (!editContent.trim()) {
      return;
    }

    try {
      if (isGuest) {
        if (!editPassword.trim()) {
          alert('비밀번호를 입력해주세요');
          return;
        }
        await updateComment(commentId, editContent, editPassword);
      } else {
        await updateComment(commentId, editContent);
      }
      setEditingId(null);
      setEditContent('');
      setEditPassword('');
      await loadComments();
    } catch (error: any) {
      alert(error.message || '댓글 수정 중 오류가 발생했습니다');
    }
  }

  async function handleDelete(commentId: string, isGuest: boolean) {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      if (isGuest) {
        const password = prompt('비밀번호를 입력해주세요:');
        if (!password) {
          return;
        }
        await deleteComment(commentId, password);
      } else {
        await deleteComment(commentId);
      }
      await loadComments();
    } catch (error: any) {
      alert(error.message || '댓글 삭제 중 오류가 발생했습니다');
    }
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent('');
  }

  return (
    <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-gray-900">댓글 {comments.length}개</h3>
      </div>

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        {!isAuthenticated && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={guestNickname}
              onChange={(e) => setGuestNickname(e.target.value)}
              placeholder="닉네임"
              disabled={submitting}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none disabled:bg-gray-100"
            />
            <input
              type="password"
              value={guestPassword}
              onChange={(e) => setGuestPassword(e.target.value)}
              placeholder="비밀번호"
              disabled={submitting}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none disabled:bg-gray-100"
            />
          </div>
        )}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            disabled={submitting}
            className="flex-1 min-w-0 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-gray-500 py-4">댓글을 불러오는 중...</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">첫 댓글을 남겨보세요!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-xl p-4">
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                  {comment.is_guest && (
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="비밀번호"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  )}
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleEdit(comment.id, comment.is_guest || false)}
                      className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                    >
                      저장
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-semibold text-gray-900">{comment.nickname}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(comment.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {(comment.is_author || comment.is_guest) && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(comment)}
                          className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id, comment.is_guest || false)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
