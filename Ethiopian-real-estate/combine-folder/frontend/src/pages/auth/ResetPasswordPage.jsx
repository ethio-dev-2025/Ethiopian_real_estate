import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/common/ErrorMessage';
import { authApi } from '@/features/auth/services/authApi';
import { getApiError } from '@/services/api/interceptors';
import { ROUTES } from '@/constants/routes';

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
        <Link to={ROUTES.FORGOT_PASSWORD} className="inline-block mt-6">
          <Button>Request new link</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = async ({ password }) => {
    setLoading(true);
    setApiError('');
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      toast.success('Password updated!');
      setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 2200);
    } catch (err) {
      setApiError(getApiError(err));
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
        {apiError && <ErrorMessage message={apiError} />}
        
        <Input
          label="New password"
          type="password"
          placeholder="At least 8 characters"
          icon={Lock}
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="Repeat password"
          icon={Lock}
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        <Button type="submit" className="w-full bg-[#176B3A] hover:bg-[#0D4528] text-white py-3.5 text-lg font-bold" loading={loading}>
          Update password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#647067]">
        <Link to={ROUTES.LOGIN} className="text-[#176B3A] font-bold hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </p>
    </div>
  );
}