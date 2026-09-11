import { Component, type ReactNode } from 'react';
import { View } from 'react-native';

import { GhostButton, PrimaryButton, Txt } from '@/components/ui';
import { reportError } from '@/lib/monitoring';

type Props = { children: ReactNode; onReset?: () => void };
type State = { error: Error | null };

/**
 * The last line before a white screen.
 *
 * Everything below this used to be local and total - a render could not fail
 * for want of data. Over a network it can, so a thrown error gets a surface
 * that says what happened and offers the only two moves that ever help: try
 * again, or go back to the start.
 *
 * Deliberately not translated: if the copy deck is what broke, `t()` would
 * throw inside the handler for the throw.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('[gimik] unhandled render error', error);
    reportError(error, { componentStack: info.componentStack ?? undefined });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <View className="flex-1 bg-brand-paper items-center justify-center px-8">
        <Txt variant="title" className="text-center">Something broke</Txt>
        <Txt variant="body" className="mt-3 text-center max-w-[320px]">
          That screen could not be drawn. Nothing you did is lost.
        </Txt>
        <Txt variant="caption" className="mt-4 text-center max-w-[320px]">{error.message}</Txt>
        <View className="mt-8 self-stretch">
          <PrimaryButton label="Try again" onPress={() => this.setState({ error: null })} />
        </View>
        {this.props.onReset ? (
          <View className="mt-2 self-stretch">
            <GhostButton label="Start over" tone="muted" onPress={this.props.onReset} />
          </View>
        ) : null}
      </View>
    );
  }
}
