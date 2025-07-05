import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';

interface ConnectWalletProps {
  showBalance?: boolean;
  compact?: boolean;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ 
  showBalance = true, 
  compact = false 
}) => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className={`flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors ${
                      compact ? 'px-3 py-2 text-sm' : 'px-4 py-2.5'
                    }`}
                  >
                    <Wallet className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
                    <span>Connect Wallet</span>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div className="flex items-center space-x-3">
                  {showBalance && (
                    <button
                      onClick={openChainModal}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      type="button"
                    >
                      {chain.hasIcon && (
                        <div
                          className="w-5 h-5 rounded-full overflow-hidden"
                          style={{ background: chain.iconBackground }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              className="w-5 h-5"
                            />
                          )}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {chain.name}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className={`flex items-center space-x-2 ${
                      compact
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 text-sm'
                        : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 px-4 py-2.5'
                    } rounded-lg font-medium transition-colors`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-green-500 rounded-full`} />
                      <span>
                        {account.displayName}
                        {showBalance && account.displayBalance
                          ? ` (${account.displayBalance})`
                          : ''}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default ConnectWallet;