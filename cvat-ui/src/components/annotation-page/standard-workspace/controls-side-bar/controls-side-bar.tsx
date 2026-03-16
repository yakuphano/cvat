// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { useSelector } from 'react-redux';
import Layout from 'antd/lib/layout';

import {
    ActiveControl, Rotation, CombinedState,
} from 'reducers';
import GlobalHotKeys, { KeyMap } from 'utils/mousetrap-react';
import { Canvas, CanvasMode } from 'cvat-canvas-wrapper';
import { LabelType } from 'cvat-core-wrapper';

import { ShortcutScope } from 'utils/enums';
import { registerComponentShortcuts } from 'actions/shortcuts-actions';
import { subKeyMap } from 'utils/component-subkeymap';
import ControlVisibilityObserver, { ExtraControlsControl } from './control-visibility-observer';
import RotateControl, { Props as RotateControlProps } from './rotate-control';
import CursorControl, { Props as CursorControlProps } from './cursor-control';
import MoveControl, { Props as MoveControlProps } from './move-control';
import FitControl, { Props as FitControlProps } from './fit-control';
import ResizeControl, { Props as ResizeControlProps } from './resize-control';
import ToolsControl from './tools-control';
import OpenCVControl from './opencv-control';
import DrawRectangleControl, { Props as DrawRectangleControlProps } from './draw-rectangle-control';
import DrawPolygonControl, { Props as DrawPolygonControlProps } from './draw-polygon-control';
import DrawPolylineControl, { Props as DrawPolylineControlProps } from './draw-polyline-control';
import DrawPointsControl, { Props as DrawPointsControlProps } from './draw-points-control';
import DrawEllipseControl, { Props as DrawEllipseControlProps } from './draw-ellipse-control';
import DrawCuboidControl, { Props as DrawCuboidControlProps } from './draw-cuboid-control';
import DrawMaskControl, { Props as DrawMaskControlProps } from './draw-mask-control';
import DrawSkeletonControl, { Props as DrawSkeletonControlProps } from './draw-skeleton-control';
import SetupTagControl, { Props as SetupTagControlProps } from './setup-tag-control';
import MergeControl, { Props as MergeControlProps } from './merge-control';
import GroupControl, { Props as GroupControlProps } from './group-control';
import JoinControl, { Props as JoinControlProps } from './join-control';
import SplitControl, { Props as SplitControlProps } from './split-control';
import SliceControl, { Props as SliceControlProps } from './slice-control';

type Label = CombinedState['annotation']['job']['labels'][0];

interface Props {
    canvasInstance: Canvas;
    activeControl: ActiveControl;
    keyMap: KeyMap;
    normalizedKeyMap: Record<string, string>;
    labels: Label[];
    frameData: any;

    updateActiveControl(activeControl: ActiveControl): void;
    rotateFrame(rotation: Rotation): void;
    repeatDrawShape(): void;
    pasteShape(): void;
    resetGroup(): void;
    redrawShape(): void;
}

const componentShortcuts = {
    // Kısayollar orijinal haliyle korunuyor (Worker'lar için n ve m tuşları kritiktir)
};

// Gözlemciler (Observers) orijinal haliyle korunuyor
const ObservedCursorControl = ControlVisibilityObserver<CursorControlProps>(CursorControl);
const ObservedMoveControl = ControlVisibilityObserver<MoveControlProps>(MoveControl);
const ObservedRotateControl = ControlVisibilityObserver<RotateControlProps>(RotateControl);
const ObservedFitControl = ControlVisibilityObserver<FitControlProps>(FitControl);
const ObservedResizeControl = ControlVisibilityObserver<ResizeControlProps>(ResizeControl);
const ObservedToolsControl = ControlVisibilityObserver(ToolsControl);
const ObservedOpenCVControl = ControlVisibilityObserver(OpenCVControl);
const ObservedDrawRectangleControl = ControlVisibilityObserver<DrawRectangleControlProps>(DrawRectangleControl);
const ObservedDrawPolygonControl = ControlVisibilityObserver<DrawPolygonControlProps>(DrawPolygonControl);
const ObservedDrawPolylineControl = ControlVisibilityObserver<DrawPolylineControlProps>(DrawPolylineControl);
const ObservedDrawPointsControl = ControlVisibilityObserver<DrawPointsControlProps>(DrawPointsControl);
const ObservedDrawEllipseControl = ControlVisibilityObserver<DrawEllipseControlProps>(DrawEllipseControl);
const ObservedDrawCuboidControl = ControlVisibilityObserver<DrawCuboidControlProps>(DrawCuboidControl);
const ObservedDrawMaskControl = ControlVisibilityObserver<DrawMaskControlProps>(DrawMaskControl);
const ObservedDrawSkeletonControl = ControlVisibilityObserver<DrawSkeletonControlProps>(DrawSkeletonControl);
const ObservedSetupTagControl = ControlVisibilityObserver<SetupTagControlProps>(SetupTagControl);
const ObservedMergeControl = ControlVisibilityObserver<MergeControlProps>(MergeControl);
const ObservedGroupControl = ControlVisibilityObserver<GroupControlProps>(GroupControl);
const ObservedJoinControl = ControlVisibilityObserver<JoinControlProps>(JoinControl);
const ObservedSplitControl = ControlVisibilityObserver<SplitControlProps>(SplitControl);
const ObservedSliceControl = ControlVisibilityObserver<SliceControlProps>(SliceControl);

export default function ControlsSideBarComponent(props: Props): JSX.Element {
    const {
        activeControl, canvasInstance, normalizedKeyMap, keyMap, labels,
        updateActiveControl, rotateFrame, repeatDrawShape, pasteShape,
        resetGroup, redrawShape, frameData,
    } = props;

    // Kullanıcı yetkisini alıyoruz
    const user = useSelector((state: CombinedState) => state.auth.user);

    const controlsDisabled = !labels.length || frameData.deleted;

    // Kontrol görünürlük mantığı (Admin her şeyi görür, Worker sadece projenin izin verdiği temel araçları)
    const isStaff = user.isStaff;

    return (
        <Layout.Sider className='cvat-canvas-controls-sidebar' theme='light' width={44}>
            <GlobalHotKeys keyMap={subKeyMap(componentShortcuts, keyMap)} handlers={{}} />

            <ObservedCursorControl
                cursorShortkey={normalizedKeyMap.CANCEL}
                canvasInstance={canvasInstance}
                activeControl={activeControl}
            />
            <ObservedMoveControl canvasInstance={canvasInstance} activeControl={activeControl} />

            {/* Döndürme worker için bazen gereksiz olabilir ama staff için kalsın */}
            {isStaff && (
                <ObservedRotateControl
                    anticlockwiseShortcut={normalizedKeyMap.ANTICLOCKWISE_ROTATION_STANDARD_CONTROLS}
                    clockwiseShortcut={normalizedKeyMap.CLOCKWISE_ROTATION_STANDARD_CONTROLS}
                    rotateFrame={rotateFrame}
                />
            )}

            <hr />

            <ObservedFitControl canvasInstance={canvasInstance} />
            <ObservedResizeControl canvasInstance={canvasInstance} activeControl={activeControl} />

            <hr />

            {/* AI ve OpenCV araçlarını sadece Admin (Staff) görebilir */}
            {isStaff && (
                <>
                    <ObservedToolsControl />
                    <ObservedOpenCVControl />
                </>
            )}

            {/* Çizim Araçları: Rectangle ve Polygon her zaman açık (en çok kullanılanlar) */}
            <ObservedDrawRectangleControl
                canvasInstance={canvasInstance}
                isDrawing={activeControl === ActiveControl.DRAW_RECTANGLE}
                disabled={controlsDisabled}
            />

            <ObservedDrawPolygonControl
                canvasInstance={canvasInstance}
                isDrawing={activeControl === ActiveControl.DRAW_POLYGON}
                disabled={controlsDisabled}
            />

            {/* Diğer araçları sadece Staff görebilir (Sadeleştirme) */}
            {isStaff && (
                <>
                    <ObservedDrawPolylineControl canvasInstance={canvasInstance} isDrawing={activeControl === ActiveControl.DRAW_POLYLINE} disabled={controlsDisabled} />
                    <ObservedDrawPointsControl canvasInstance={canvasInstance} isDrawing={activeControl === ActiveControl.DRAW_POINTS} disabled={controlsDisabled} />
                    <ObservedDrawEllipseControl canvasInstance={canvasInstance} isDrawing={activeControl === ActiveControl.DRAW_ELLIPSE} disabled={controlsDisabled} />
                    <ObservedDrawCuboidControl canvasInstance={canvasInstance} isDrawing={activeControl === ActiveControl.DRAW_CUBOID} disabled={controlsDisabled} />
                    <ObservedDrawMaskControl canvasInstance={canvasInstance} isDrawing={activeControl === ActiveControl.DRAW_MASK} disabled={controlsDisabled} />
                    <ObservedDrawSkeletonControl canvasInstance={canvasInstance} isDrawing={activeControl === ActiveControl.DRAW_SKELETON} disabled={controlsDisabled} />
                </>
            )}

            <ObservedSetupTagControl canvasInstance={canvasInstance} disabled={controlsDisabled} />

            <hr />

            <ObservedMergeControl canvasInstance={canvasInstance} dynamicIconProps={{}} disabled={controlsDisabled || !isStaff} />
            <ObservedGroupControl canvasInstance={canvasInstance} dynamicIconProps={{}} disabled={controlsDisabled || !isStaff} />

            {/* Split, Join, Slice gibi karmaşık düzenleme araçlarını sadece Staff görebilir */}
            {isStaff && (
                <>
                    <ObservedSplitControl canvasInstance={canvasInstance} dynamicIconProps={{}} disabled={controlsDisabled} />
                    <ObservedJoinControl updateActiveControl={updateActiveControl} canvasInstance={canvasInstance} activeControl={activeControl} disabled={controlsDisabled} />
                    <ObservedSliceControl updateActiveControl={updateActiveControl} canvasInstance={canvasInstance} activeControl={activeControl} disabled={controlsDisabled} />
                </>
            )}

            {isStaff && <ExtraControlsControl />}
        </Layout.Sider>
    );
}