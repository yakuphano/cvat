import React from 'react';
import Form from 'antd/lib/form';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import { Row, Col } from 'antd/lib/grid';
import { Link } from 'react-router-dom';
import CVATSigningInput, { CVATInputType } from 'components/signing-common/cvat-signing-input';

export interface LoginData {
    credential: string;
    password: string;
}

interface Props {
    fetching: boolean;
    onSubmit(loginData: LoginData): void;
}

function LoginFormComponent(props: Props): JSX.Element {
    const { fetching, onSubmit } = props;
    const [form] = Form.useForm();

    return (
        <div className='ds-actual-form-wrapper'>
            <Form
                form={form}
                layout='vertical'
                onFinish={(loginData: LoginData) => {
                    onSubmit(loginData);
                }}
            >
                <Form.Item
                    label='Username or Email'
                    name='credential'
                    rules={[{ required: true, message: 'Please specify a username or email' }]}
                >
                    <Input autoComplete='username' placeholder='Username or email' />
                </Form.Item>

                <Form.Item
                    label='Password'
                    name='password'
                    rules={[{ required: true, message: 'Please specify a password' }]}
                >
                    <CVATSigningInput
                        type={CVATInputType.PASSWORD}
                        id='password'
                        placeholder='Password'
                        autoComplete='current-password'
                    />
                </Form.Item>

                <Form.Item>
                    <Button
                        className='cvat-credentials-action-button'
                        loading={fetching}
                        htmlType='submit'
                        type='primary'
                        block
                    >
                        Sign In
                    </Button>
                </Form.Item>

                <Row justify='space-between' className='ds-nav-links'>
                    <Col><Link to='/auth/register'>Create an Account</Link></Col>
                    <Col><Link to='/auth/password/reset'>Forgot password?</Link></Col>
                </Row>
            </Form>
        </div>
    );
}

export default React.memo(LoginFormComponent);