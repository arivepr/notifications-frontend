import {
  Badge,
  Button,
  ButtonProps,
  ButtonVariant,
  ExpandableSection,
  ExpandableSectionToggle,
  Popover,
  SearchInput,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
  Tooltip,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import {
  global_BackgroundColor_100,
  global_palette_black_1000,
  global_spacer_lg,
} from '@patternfly/react-tokens';
import * as React from 'react';
import { style } from 'typestyle';

import { useAppContext } from '../../../app/AppContext';
import { BehaviorGroupCardList } from '../../../components/Notifications/BehaviorGroup/BehaviorGroupCardList';
import { useDeleteModalReducer } from '../../../hooks/useDeleteModalReducer';
import { useFormModalReducer } from '../../../hooks/useFormModalReducer';
import { CreateBehaviorGroup } from '../../../types/CreateBehaviorGroup';
import { BehaviorGroup, Facet } from '../../../types/Notification';
import { emptyImmutableArray } from '../../../utils/Immutable';
import { BehaviorGroupWizardPage } from '../BehaviorGroupWizard/BehaviorGroupWizardPage';
import { DeleteBehaviorGroupPage } from '../Form/DeleteBehaviorGroupPage';
import { BehaviorGroupContent } from './useBehaviorGroupContent';

const expandableSectionClassName = {
  backgroundColor: global_BackgroundColor_100.var,
  paddingLeft: global_spacer_lg.var,
  paddingRight: global_spacer_lg.var,
};

const sectionClassName = style(expandableSectionClassName, {
  paddingBottom: global_spacer_lg.var,
});

const sectionTitleClassName = style(expandableSectionClassName, {
  paddingTop: global_spacer_lg.var,
});

const titleClassName = style({
  marginTop: '-0.15em',
  color: global_palette_black_1000.var,
});

const defaultIconClassName = style({
  marginTop: '2px',
  marginLeft: '-16px',
});

const badgeClassName = style({
  marginTop: '10px',
  marginLeft: '-16px',
});

const emptyAddButtonClassName = style({
  marginTop: '-0.2em',
});

interface BehaviorGroupSectionProps {
  bundle: Facet;
  applications: ReadonlyArray<Facet>;
  behaviorGroupContent: BehaviorGroupContent;
}

type BehaviorGroupAddButtonProps = Pick<
  ButtonProps,
  'className' | 'onClick' | 'isDisabled' | 'component'
>;

const BehaviorGroupAddButton: React.FunctionComponent<BehaviorGroupAddButtonProps> =
  (props) => {
    const { isDisabled, ...buttonProps } = props;
    const { isOrgAdmin } = useAppContext();

    const button = (
      <Button
        {...buttonProps}
        isAriaDisabled={isDisabled}
        variant={ButtonVariant.primary}
      >
        Create new group
      </Button>
    );

    if (isDisabled) {
      const content = isOrgAdmin
        ? 'You need the Notifications administrator role to perform this action'
        : 'You do not have permissions to perform this action. Contact your org admin for more information';
      return <Tooltip content={content}>{button}</Tooltip>;
    }

    return button;
  };

export const BehaviorGroupsSection: React.FunctionComponent<BehaviorGroupSectionProps> =
  (props) => {
    const [isExpanded, setExpanded] = React.useState(true);
    const [filter, setFilter] = React.useState<string>('');
    const { rbac } = useAppContext();

    const filteredBehaviors = React.useMemo(() => {
      if (
        !props.behaviorGroupContent.isLoading &&
        !props.behaviorGroupContent.hasError
      ) {
        const lowerCaseFilter = filter.toLowerCase();
        return props.behaviorGroupContent.content.filter((bg) =>
          bg.displayName.toLowerCase().includes(lowerCaseFilter)
        );
      }

      return emptyImmutableArray;
    }, [filter, props.behaviorGroupContent]);

    const [editModalState, editModalActions] =
      useFormModalReducer<CreateBehaviorGroup>();
    const [deleteModalState, deleteModalActions] =
      useDeleteModalReducer<BehaviorGroup>();

    const createGroup = React.useCallback(
      (event) => {
        event.stopPropagation();
        editModalActions.create({
          events: [],
          actions: [],
          displayName: '',
        });
      },
      [editModalActions]
    );

    const onCloseModal = React.useCallback(
      (saved: boolean) => {
        const reload = props.behaviorGroupContent.reload;
        if (saved) {
          reload();
        }

        editModalActions.reset();
      },
      [editModalActions, props.behaviorGroupContent.reload]
    );

    const onEdit = React.useCallback(
      (behaviorGroup: BehaviorGroup) => {
        editModalActions.edit({
          id: behaviorGroup.id,
          events: behaviorGroup.events,
          actions: behaviorGroup.actions,
          displayName: behaviorGroup.displayName,
        });
      },
      [editModalActions]
    );

    const onDelete = React.useCallback(
      (behaviorGroup: BehaviorGroup) => {
        deleteModalActions.delete(behaviorGroup);
      },
      [deleteModalActions]
    );

    const onCloseDelete = React.useCallback(
      (deleted: boolean) => {
        const reload = props.behaviorGroupContent.reload;
        if (deleted) {
          reload();
        }

        deleteModalActions.reset();
      },
      [deleteModalActions, props.behaviorGroupContent.reload]
    );

    const onClearFilter = React.useCallback(() => {
      setFilter('');
    }, [setFilter]);

    const contentId = 'behavior-group-section-content';

    return (
      <>
        <div className={sectionTitleClassName}>
          <Split hasGutter>
            <ExpandableSectionToggle
              isExpanded={isExpanded}
              onToggle={setExpanded}
              contentId={contentId}
              direction="down"
            >
              <SplitItem>
                <Title className={titleClassName} headingLevel="h2">
                  Behavior groups
                </Title>
              </SplitItem>
            </ExpandableSectionToggle>
            <SplitItem>
              {!props.behaviorGroupContent.isLoading &&
                !props.behaviorGroupContent.hasError &&
                (props.behaviorGroupContent.content.length > 0 ? (
                  <Badge className={badgeClassName} isRead>
                    {props.behaviorGroupContent.content.length}
                  </Badge>
                ) : (
                  <BehaviorGroupAddButton
                    className={emptyAddButtonClassName}
                    component="a"
                    onClick={createGroup}
                    isDisabled={!rbac.canWriteNotifications}
                  />
                ))}
            </SplitItem>
            <SplitItem>
              <Popover
                position="right"
                hideOnOutsideClick
                appendTo={() => document.body}
                headerContent={
                  <div className="pf-u-color-100">Behavior groups</div>
                }
                bodyContent={
                  <div className="pf-u-font-size-sm pf-u-color-100">
                    Behavior groups are made up of action/recipient pairings
                    that allow you to configure which notification actions
                    different users will be able to receive. Once you&apos;ve
                    created a behavior group, you can assign it to an event
                    using the Events table below.{' '}
                  </div>
                }
                footerContent={
                  <div className="pf-u-font-size-sm pf-u-color-100">
                    {' '}
                    You may also prevent users from changing assigned actions by
                    locking action/recipient pairings when creating or editing
                    behavior groups.
                  </div>
                }
              >
                <Button
                  className={defaultIconClassName}
                  variant="plain"
                  aria-label="Help"
                >
                  <OutlinedQuestionCircleIcon />
                </Button>
              </Popover>
            </SplitItem>
          </Split>
        </div>
        <ExpandableSection
          className={sectionClassName}
          contentId={contentId}
          isExpanded={isExpanded}
          onToggle={setExpanded}
          isDetached
        >
          <Stack hasGutter>
            {(props.behaviorGroupContent.isLoading ||
              props.behaviorGroupContent.hasError ||
              props.behaviorGroupContent.content.length > 0) && (
              <>
                <StackItem>
                  <Split hasGutter>
                    <SplitItem>
                      <SearchInput
                        value={filter}
                        onChange={setFilter}
                        onClear={onClearFilter}
                        type="text"
                        aria-label="Search by name"
                        placeholder="Search by name"
                        isDisabled={props.behaviorGroupContent.isLoading}
                      />
                    </SplitItem>
                    <SplitItem>
                      <BehaviorGroupAddButton
                        isDisabled={
                          props.behaviorGroupContent.isLoading ||
                          !rbac.canWriteNotifications
                        }
                        onClick={createGroup}
                      />
                    </SplitItem>
                  </Split>
                </StackItem>
                <StackItem>
                  {props.behaviorGroupContent.isLoading ? (
                    <BehaviorGroupCardList />
                  ) : props.behaviorGroupContent.hasError ? (
                    <div>Error loading behavior groups</div>
                  ) : (
                    <BehaviorGroupCardList
                      onEdit={rbac.canWriteNotifications ? onEdit : undefined}
                      onDelete={
                        rbac.canWriteNotifications ? onDelete : undefined
                      }
                      behaviorGroups={filteredBehaviors}
                    />
                  )}
                </StackItem>
              </>
            )}
          </Stack>
          {editModalState.isOpen && (
            <BehaviorGroupWizardPage
              bundle={props.bundle}
              applications={props.applications}
              behaviorGroup={editModalState.template}
              onClose={onCloseModal}
            />
          )}
          {deleteModalState.isOpen && (
            <DeleteBehaviorGroupPage
              behaviorGroup={deleteModalState.data}
              onClose={onCloseDelete}
            />
          )}
        </ExpandableSection>
      </>
    );
  };
