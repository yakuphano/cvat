// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Form from 'antd/lib/form';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import { Col, Row } from 'antd/lib/grid';
import Title from 'antd/lib/typography/Title';
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
        <div className='cvat-login-form-wrapper'>
            <Row justify='start' className='cvat-credentials-navigation'>
                {/* Navigasyon ve linkler sadeleştirme amacıyla kaldırıldı */}
            </Row>
            <Col>
                <Title level={2}> Sign in </Title>
            </Col>
            <Form
                className='cvat-login-form'
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
                    <Input
                        autoComplete='username'
                        placeholder='Enter your username'
                    />
                </Form.Item>

                <Form.Item
                    label='Password'
                    name='password'
                    rules={[{ required: true, message: 'Please specify a password' }]}
                >
                    <CVATSigningInput
                        type={CVATInputType.PASSWORD}
                        id='password'
                        placeholder='Enter your password'
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
                        Login
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}

export default React.memo(LoginFormComponent);