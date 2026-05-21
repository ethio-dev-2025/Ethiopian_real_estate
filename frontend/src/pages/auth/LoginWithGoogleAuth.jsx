import { GoogleLogin } from '@react-oauth/google'

function LoginWithGooglePage() {

  const handleSuccess = async (credentialResponse) => {
    console.log(credentialResponse.credential)  
    // send token to backend
  }

  const handleError = () => {
    console.log('Login Failed')
  }

  return (
    <div>
      <h1>Login</h1>

      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  )
}

export default LoginWithGooglePage