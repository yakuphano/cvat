// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Col } from 'antd/lib/grid';
import Icon, { StopOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import Modal from 'antd/lib/modal';
import Button from 'antd/lib/button';
import Text from 'antd/lib/typography/Text';

import { UndoIcon, RedoIcon } from 'icons';
import { ActiveControl, ToolsBlockerState } from 'reducers';
import { registerComponentShortcuts } from 'actions/shortcuts-actions';
import AnnotationMenuComponent from 'components/annotation-page/top-bar/annotation-menu';
import CVATTooltip from 'components/common/cvat-tooltip';
import { ShortcutScope } from 'utils/enums';
import { subKeyMap } from 'utils/component-subkeymap';
import GlobalHotKeys, { KeyMap } from 'utils/mousetrap-react';
import { finishDrawAvailable } from 'utils/drawing';
import SaveAnnotationsButton from './save-annotations-button';

interface Props {
    saving: boolean;
    undoAction?: string;
    redoAction?: string;
    undoShortcut: string;
    redoShortcut: string;
    drawShortcut: string;
    switchToolsBlockerShortcut: string;
    toolsBlockerState: ToolsBlockerState;
    activeControl: ActiveControl;
    keyMap: KeyMap;
    onUndoClick(): void;
    onRedoClick(): void;
    onFinishDraw(): void;
    onSwitchToolsBlockerState(): void;
}

const componentShortcuts = {
    UNDO: {
        name: 'Undo action',
        description: 'Cancel the latest action',
        sequences: ['ctrl+z'],
        scope: ShortcutScope.ANNOTATION_PAGE,
    },
    REDO: {
        name: 'Redo action',
        description: 'Cancel undo action',
        sequences: ['ctrl+shift+z', 'ctrl+y'],
        scope: ShortcutScope.ANNOTATION_PAGE,
    },
};

registerComponentShortcuts(componentShortcuts);

function LeftGroup(props: Props): JSX.Element {
    const {
        saving,
        keyMap,
        undoAction,
        redoAction,
        undoShortcut,
        redoShortcut,
        drawShortcut,
        activeControl,
        onUndoClick,
        onRedoClick,
        onFinishDraw,
    } = props;

    const includesDoneButton = finishDrawAvailable(activeControl);

    const handlers: Record<keyof typeof componentShortcuts, (event?: KeyboardEvent) => void> = {
        UNDO: (event: KeyboardEvent | undefined) => {
            event?.preventDefault();
            if (undoAction) onUndoClick();
        },
        REDO: (event: KeyboardEvent | undefined) => {
            event?.preventDefault();
            if (redoAction) onRedoClick();
        },
    };

    return (
        <>
            <GlobalHotKeys keyMap={subKeyMap(componentShortcuts, keyMap)} handlers={handlers} />
            { saving && (
                <Modal
                    open
                    destroyOnClose
                    className='cvat-saving-job-modal'
                    closable={false}
                    footer={[]}
                >
                    <Text strong>Saving your progress, please wait... </Text>
                    <LoadingOutlined style={{ marginLeft: '10px' }} />
                </Modal>
            )}
            <Col className='cvat-annotation-header-left-group' style={{ display: 'flex', alignItems: 'center' }}>
                {/* Ana Menü - Worker'lar için kısıtlanmış olacak */}
                <AnnotationMenuComponent />

                {/* Kaydet Butonu - En kritik buton */}
                <SaveAnnotationsButton />

                <div style={{ marginLeft: '10px', borderLeft: '1px solid #d9d9d9', paddingLeft: '10px', display: 'flex' }}>
                    <CVATTooltip overlay={`Undo ${undoShortcut}`}>
                        <Button
                            disabled={!undoAction}
                            type='link'
                            className='cvat-annotation-header-undo-button cvat-annotation-header-button'
                            onClick={onUndoClick}
                        >
                            <Icon component={UndoIcon} />
                            <span>Undo</span>
                        </Button>
                    </CVATTooltip>

                    <CVATTooltip overlay={`Redo ${redoShortcut}`}>
                        <Button
                            disabled={!redoAction}
                            type='link'
                            className='cvat-annotation-header-redo-button cvat-annotation-header-button'
                            onClick={onRedoClick}
                        >
                            <Icon component={RedoIcon} />
                            <span>Redo</span>
                        </Button>
                    </CVATTooltip>
                </div>

                {includesDoneButton && (
                    <CVATTooltip overlay={`Finish drawing (${drawShortcut})`}>
                        <Button
                            type='primary'
                            size='small'
                            style={{ marginLeft: '10px', borderRadius: '4px' }}
                            onClick={onFinishDraw}
                        >
                            <CheckCircleOutlined />
                            Done
                        </Button>
                    </CVATTooltip>
                )}
            </Col>
        </>
    );
}

export default React.memo(LeftGroup);