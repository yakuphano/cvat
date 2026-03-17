import './styles.scss';
import React from 'react';
import { RouteComponentProps } from 'react-router';
import { withRouter } from 'react-router-dom';
import LoginForm, { LoginData } from './login-form';

interface LoginPageComponentProps {
    fetching: boolean;
    onLogin: (credential: string, password: string) => void;
}

function LoginPageComponent(props: LoginPageComponentProps & RouteComponentProps): JSX.Element {
    const { fetching, onLogin } = props;

    return (
        <div className="ds-login-container">
            <div className="ds-login-card">
                <div className="ds-side-panel">
                    <div className="ds-welcome-content">
                        <h1>Deep Studio</h1>
                        <p>Welcome back!</p>
                        <span>Sign in to continue to your dashboard.</span>
                    </div>
                </div>
                <div className="ds-form-panel">
                    <div className="ds-form-header">
                        <h2>Sign In</h2>
                    </div>
                    <LoginForm
                        fetching={fetching}
                        onSubmit={(loginData: LoginData): void => {
                            onLogin(loginData.credential, loginData.password);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default withRouter(LoginPageComponent);