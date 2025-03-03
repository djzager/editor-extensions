import "./incidentTable.css";
import { basename } from "node:path"
import React, { FC, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  LabelGroup,
  Label,
  Dropdown,
  MenuToggleElement,
  MenuToggle,
  MenuToggleCheckbox,
  DropdownList,
  DropdownItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
} from "@patternfly/react-core";
import { EnhancedIncident, Incident } from "@editor-extensions/shared";
import { Table, Tr, Tbody, Td } from "@patternfly/react-table";
import { useExtensionStateContext } from "../../context/ExtensionStateContext";
import { openFile } from "../../hooks/actions";
import { getIncidentRelativePath } from "../../utils/incident";
import GetSolutionDropdown from "../GetSolutionDropdown";

export interface EnhancedIncidentTableProps {
  incidents: EnhancedIncident[];
  isReadOnly?: boolean;
}

export const EnhancedIncidentTable: FC<EnhancedIncidentTableProps> = ({
  incidents,
  isReadOnly = false,
}) => {
  const { state, dispatch } = useExtensionStateContext();
  const [focusedIncident, setFocusedIncident] = useState<Incident | null>(null);
  const [selectedIncidents, setSelectedIncidents] = useState<EnhancedIncident[]>([]);
  const [bulkSelection, setBulkSelection] = React.useState("");
  const [isBulkSelectDropdownOpen, setIsBulkSelectDropdownOpen] = useState<boolean>(false);
  const { workspaceRoot } = state;

  // Ruleset handling
  const [rulesetSelected, setRulesetSelected] = useState("");
  const [rulesetExpanded, setRulesetExpanded] = useState(false);
  const onRulesetToggle = () => {
    setRulesetExpanded((prevState) => !prevState);
  };
  const onRulesetSelect = (
    _event: React.MouseEvent | undefined,
    selection: string | number | undefined,
  ) => {
    setRulesetSelected(selection as string);
    setRulesetExpanded(false);
  };
  const rulesetOptions = [...new Set(incidents.map((i) => i.ruleset_name))];
  console.log(rulesetOptions);
  // end ruleset handling

  // category handling
  const [categorySelected, setCategorySelected] = useState("");
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const onCategoryToggle = () => {
    setCategoryExpanded((prevState) => !prevState);
  };
  const onCategorySelect = (
    _event: React.MouseEvent | undefined,
    selection: string | number | undefined,
  ) => {
    setCategorySelected(selection as string);
    setCategoryExpanded(false);
  };
  const categoryOptions = [...new Set(incidents.map((i) => i.violation_category))];
  console.log(categoryOptions);
  // end category handling

  // labels handling
  const [labelSelected, setLabelSelected] = useState("");
  const [labelExpanded, setLabelExpanded] = useState(false);
  const onLabelToggle = () => {
    setLabelExpanded((prevState) => !prevState);
  };
  const onLabelSelect = (
    _event: React.MouseEvent | undefined,
    selection: string | number | undefined,
  ) => {
    setLabelSelected(selection as string);
    setLabelExpanded(false);
  };
  const labelOptions = [...new Set(incidents.flatMap((i) => i.violation_labels))];

  // incident uri handling
  const [fileSelected, setFileSelected] = useState("");
  const [fileExpanded, setFileExpanded] = useState(false);
  const onFileToggle = () => {
    setFileExpanded((prevState) => !prevState);
  };
  const onFileSelect = (
    _event: React.MouseEvent | undefined,
    selection: string | number | undefined,
  ) => {
    setFileSelected(selection as string);
    setFileExpanded(false);
  };

  const fileOptions = [...new Set(incidents.map((i) => getIncidentRelativePath(i, workspaceRoot)))];

  const setIncidentSelected = (row: EnhancedIncident, isSelecting: boolean) =>
    setSelectedIncidents((prevSelected) => {
      const otherSelectedIncidents = prevSelected.filter((r) => {
        return r.violationId + r.uri + r.lineNumber !== row.violationId + row.uri + row.lineNumber;
      });
      return isSelecting ? [...otherSelectedIncidents, row] : otherSelectedIncidents;
    });
  const [filters, setFilters] = useState({
    uri: "",
    ruleset_name: "",
    category: "",
    label: "",
  });

  const selectAllIncidents = (isSelecting: boolean) =>
    setSelectedIncidents(isSelecting ? incidents.map((r) => r) : []);

  const isIncidentSelected = (row: EnhancedIncident) => selectedIncidents.includes(row);

  const handleIncidentSelect = (incident: Incident) => {
    setFocusedIncident(incident);
    dispatch(openFile(incident.uri, incident.lineNumber ?? 0));
  };

  // Toggle selection for a single incident
  const toggleIncidentSelection = (incident) => {
    setSelectedIncidents(
      (prevSelected) =>
        prevSelected.some((i) => i.violationId + i.uri === incident.violationId + incident.uri)
          ? prevSelected.filter(
              (i) => i.violationId + i.uri !== incident.violationId + incident.uri,
            ) // Deselect
          : [...prevSelected, incident], // Select
    );
  };

  const buildBulkSelectDropdown = () => {
    const numSelected = selectedIncidents.length;
    const allSelected = numSelected === incidents.length;
    const anySelected = numSelected > 0;
    const someChecked = anySelected ? null : false;
    const isChecked = allSelected ? true : someChecked;

    const items = (
      <>
        <DropdownItem value="none">Select none (0 items)</DropdownItem>
        <DropdownItem value="all">Select all ({incidents.length} items)</DropdownItem>
      </>
    );

    return (
      <Dropdown
        role="menu"
        isOpen={isBulkSelectDropdownOpen}
        onOpenChange={(isOpen: boolean) => setIsBulkSelectDropdownOpen(isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            isExpanded={isBulkSelectDropdownOpen}
            onClick={() => setIsBulkSelectDropdownOpen(!isBulkSelectDropdownOpen)}
            aria-label="Select cards"
            splitButtonOptions={{
              items: [
                <MenuToggleCheckbox
                  id="split-dropdown-checkbox"
                  key="split-dropdown-checkbox"
                  aria-label={anySelected ? "Deselect all cards" : "Select all cards"}
                  isChecked={isChecked}
                  onClick={() =>
                    anySelected
                      ? setSelectedIncidents([])
                      : selectAllIncidents(bulkSelection !== "all")
                  }
                >
                  {numSelected !== 0 && `${numSelected} selected`}
                </MenuToggleCheckbox>,
              ],
            }}
          ></MenuToggle>
        )}
      >
        <DropdownList>{items}</DropdownList>
      </Dropdown>
    );
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Filter incidents based on the filters
  const filteredIncidents = incidents.filter((incident) => {
    return (
      (!filters.uri || incident.uri.includes(filters.uri)) &&
      (!filters.ruleset_name || incident.ruleset_name?.includes(filters.ruleset_name)) &&
      (!filters.category || incident.violation_category?.includes(filters.category)) &&
      (!filters.label || incident.violation_labels?.some((label) => label.includes(filters.label)))
    );
  });

  return (
    <>
      <Toolbar>
        <ToolbarContent>
          <ToolbarGroup>
            <ToolbarItem>{buildBulkSelectDropdown()}</ToolbarItem>
          </ToolbarGroup>
          <ToolbarItem>
            <SearchInput placeholder="Search incidents" />
          </ToolbarItem>
          <ToolbarGroup variant="filter-group">
            <ToolbarItem>
              <Select
                role="menu"
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={onRulesetToggle}
                    isExpanded={rulesetExpanded}
                  >
                    Ruleset
                  </MenuToggle>
                )}
                isOpen={rulesetExpanded}
                onSelect={onRulesetSelect}
                onOpenChange={(isOpen) => setRulesetExpanded(isOpen)}
                selected={rulesetExpanded}
              >
                <SelectList>
                  {rulesetOptions.map((name) => (
                    <SelectOption key={name}>{name}</SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarItem>
            <ToolbarItem>
              <Select
                role="menu"
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={onCategoryToggle}
                    isExpanded={categoryExpanded}
                  >
                    Category
                  </MenuToggle>
                )}
                isOpen={categoryExpanded}
                onSelect={onCategorySelect}
                onOpenChange={(isOpen) => setCategoryExpanded(isOpen)}
                selected={categoryExpanded}
              >
                <SelectList>
                  {categoryOptions.map((name) => (
                    <SelectOption key={name}>{name}</SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarItem>
            <ToolbarItem>
              <Select
                role="menu"
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle ref={toggleRef} onClick={onLabelToggle} isExpanded={labelExpanded}>
                    Labels
                  </MenuToggle>
                )}
                isOpen={labelExpanded}
                onSelect={onLabelSelect}
                onOpenChange={(isOpen) => setLabelExpanded(isOpen)}
                selected={labelExpanded}
              >
                <SelectList>
                  {labelOptions.map((name) => (
                    <SelectOption key={name}>{name}</SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarItem>
            <ToolbarItem>
              <Select
                role="menu"
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle ref={toggleRef} onClick={onFileToggle} isExpanded={fileExpanded}>
                    Files
                  </MenuToggle>
                )}
                popperProps={{
                  appendTo: document.body,
                  position: "right",
                  enableFlip: true,
                  preventOverflow: true,
                }}
                isOpen={fileExpanded}
                onSelect={onFileSelect}
                onOpenChange={(isOpen) => setFileExpanded(isOpen)}
                selected={setFileSelected}
              >
                <SelectList>
                  {fileOptions.map((name) => (
                    <SelectOption key={name}>{name}</SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarItem>
          </ToolbarGroup>
          <ToolbarItem align={{ default: "alignEnd" }}>
            <GetSolutionDropdown incidents={selectedIncidents} scope="in-between" />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table aria-label="Incident Table" borders={true}>
        <Tbody>
          {incidents.map((incident, rowIndex) => {
            return (
              <Tr key={incident.violationId}>
                <Td
                  select={{
                    rowIndex,
                    onSelect: () => toggleIncidentSelection(incident),
                    isSelected: isIncidentSelected(incident),
                  }}
                />
                <Td>
                  <Card
                    isSelectable
                    isSelected={isIncidentSelected(incident)}
                    onClick={() => toggleIncidentSelection(incident)}
                    isCompact
                  >
                    <CardTitle>
                      <b>{incident.ruleset_name}:</b> {incident.violation_description}
                      {"  "}
                      <LabelGroup>
                        {incident.violation_labels?.map((violationLabel) => (
                          <Label key={violationLabel} variant="outline">
                            {violationLabel}
                          </Label>
                        ))}
                      </LabelGroup>
                    </CardTitle>
                    <CardBody>
                      <Badge>{incident.violation_category}</Badge>
                      {"  "}
                      Location:{"  "}
                      <Button
                        component="a"
                        variant="link"
                        isInline
                        onClick={() => handleIncidentSelect(incident)}
                      >
                        {getIncidentRelativePath(incident, workspaceRoot)}:{incident.lineNumber}
                      </Button>
                    </CardBody>
                  </Card>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </>
  );
};
