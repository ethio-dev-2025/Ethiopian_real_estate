import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/common/Button';
import { authAPI } from '@/services/api';

const schema = z.object({
  password: z.string().min(8, 'At least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  path: ['confirm'],
  message: 'Passwords do not match',
});

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-[#FDECEB] flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-[#C0392B]" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-[#24332A]">Invalid reset link</h1>
        <p className="mt-2 text-sm text-[#647067]">This password reset link is missing its token.</p>
        <Link to="/forgot-password" className="inline-block mt-6">
          <Button>Request new link</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = async ({ password }) => {
    setLoading(true);
    setApiError('');
    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
      toast.success('Password updated!');
      setTimeout(() => navigate('/login', { replace: true }), 2200);
    } catch (err) {
      setApiError(
        err.response?.data?.detail
        || err.response?.data?.message
        || err.message
        || 'Unable to update password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-[#E7F2E8] flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-[#176B3A]" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-[#24332A]">Password updated</h1>
        <p className="mt-2 text-sm text-[#647067]">Redirecting you to sign in...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#24332A]">Set a new password</h1>
      <p className="mt-1 text-sm text-[#647067]">Choose a strong password with at least 8 characters.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {apiError && (
          <p role="alert" className="rounded-lg border border-[#F2C7C4] bg-[#FDECEB] px-3 py-2 text-sm text-[#C0392B]">
            {apiError}
          </p>
        )}

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#24332A]">
            New password
          </label>
          <div className="relative">
            <Lock aria-hidden="true" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#647067]" />
            <input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className="w-full rounded-xl border border-[#D7DED9] py-3 pl-10 pr-4 text-[#24332A] focus:border-[#176B3A] focus:outline-none focus:ring-2 focus:ring-[#176B3A]/20"
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-[#C0392B]">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-[#24332A]">
            Confirm password
          </label>
          <div className="relative">
            <Lock aria-hidden="true" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#647067]" />
            <input
              id="confirm"
              type="password"
              placeholder="Repeat password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirm)}
              aria-describedby={errors.confirm ? 'confirm-error' : undefined}
              className="w-full rounded-xl border border-[#D7DED9] py-3 pl-10 pr-4 text-[#24332A] focus:border-[#176B3A] focus:outline-none focus:ring-2 focus:ring-[#176B3A]/20"
              {...register('confirm')}
            />
          </div>
          {errors.confirm && (
            <p id="confirm-error" className="mt-1 text-sm text-[#C0392B]">
              {errors.confirm.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full bg-[#176B3A] py-3.5 text-lg font-bold text-white hover:bg-[#0D4528]" loading={loading}>
          Update password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#647067]">
        <Link to="/login" className="text-[#176B3A] font-bold hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </p>
    </div>
  );
}