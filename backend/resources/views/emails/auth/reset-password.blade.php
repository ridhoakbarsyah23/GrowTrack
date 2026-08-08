@component('mail::message')
# Reset Password

Kami menerima permintaan untuk melakukan reset password pada akun Anda.

@component('mail::button', ['url' => env('FRONTEND_URL', 'http://localhost:3000') . '/reset-password?token=' . $token . '&email=' . urlencode($email)])
Reset Password
@endcomponent

Link reset password ini akan kedaluwarsa dalam 60 menit.

Jika Anda tidak melakukan permintaan ini, Anda tidak perlu melakukan tindakan apapun.

Terima kasih,<br>
{{ config('app.name') }}
@endcomponent
