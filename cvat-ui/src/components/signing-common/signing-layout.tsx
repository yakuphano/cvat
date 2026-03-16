// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React from 'react';
import Layout from 'antd/lib/layout';
import { Col, Row } from 'antd/lib/grid';
import Title from 'antd/lib/typography/Title';
import Text from 'antd/lib/typography/Text';

interface SignInLayoutComponentProps {
    children: JSX.Element | JSX.Element[];
}

interface Sizes {
    xs?: { span: number };
    sm?: { span: number };
    md?: { span: number };
    lg?: { span: number };
    xl?: { span: number };
    xxl?: { span: number };
}

interface FormSizes {
    wrapper: Sizes;
    form: Sizes;
}

export const formSizes: FormSizes = {
    wrapper: {
        xs: { span: 24 },
        sm: { span: 24 },
        md: { span: 24 },
        lg: { span: 24 },
        xl: { span: 14 },
        xxl: { span: 12 },
    },
    form: {
        xs: { span: 18 },
        sm: { span: 16 },
        md: { span: 14 },
        lg: { span: 12 },
        xl: { span: 16 },
        xxl: { span: 14 },
    },
};

function SignInLayout(props: SignInLayoutComponentProps): JSX.Element {
    const { children } = props;
    const { Content } = Layout;

    const titleSizes = {
        xs: { span: 0 },
        sm: { span: 0 },
        md: { span: 0 },
        lg: { span: 0 },
        xl: { span: 10 },
        xxl: { span: 10 },
    };

    return (
        <Layout className='cvat-signing-layout-container'>
            <Layout className='cvat-signing-layout'>
                <Content>
                    <Row justify='center' align='middle' style={{ height: '100%' }}>
                        <Col {...titleSizes} className='cvat-signing-title-container'>
                            <Title className='deep-studio-title'>Deep Studio</Title>
                            <Text className='deep-studio-subtitle'>
                                Advanced AI Data Solutions & Labeling Services
                            </Text>
                        </Col>
                        {children}
                    </Row>
                </Content>
            </Layout>
        </Layout>
    );
}

export default SignInLayout;